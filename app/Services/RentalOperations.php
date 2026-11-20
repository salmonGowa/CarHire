<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\BookingExtension;
use App\Models\BookingInspection;
use App\Models\User;
use App\Support\Settings;
use Carbon\CarbonInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The physical side of a rental: handing over the keys, taking the car back
 * (with charges for lateness, fuel, mileage and damage), settling the
 * security deposit, and extending the hire.
 *
 * Charges use the dealer's rental policy (Dealer::policy) and are added to the
 * invoice as extra lines; the booking total stays the rental price.
 */
class RentalOperations
{
    public function __construct(private BookingService $bookings, private FinanceService $finance, private Notifier $notifier) {}

    // ── Handover ──────────────────────────────────────────────────────────────

    /**
     * @param  array{odometer: int, fuel_level: int, notes?: string|null, deposit_received?: int, deposit_method?: string|null, deposit_reference?: string|null}  $data
     * @param  list<UploadedFile>  $photos
     */
    public function handover(User $actor, Booking $booking, array $data, array $photos = []): Booking
    {
        if ($booking->status !== BookingStatus::Confirmed) {
            throw ValidationException::withMessages(['booking' => 'Only confirmed bookings can be handed over.']);
        }

        return DB::transaction(function () use ($actor, $booking, $data, $photos) {
            $this->inspect($actor, $booking, 'pickup', $data, $photos);
            $deposit = (int) ($data['deposit_received'] ?? 0);
            $booking->update([
                'picked_up_at' => now(),
                'deposit_received' => $deposit,
                'deposit_method' => $deposit > 0 ? $data['deposit_method'] : null,
                'deposit_reference' => $deposit > 0 ? ($data['deposit_reference'] ?? null) : null,
                'deposit_received_at' => $deposit > 0 ? now() : null,
            ]);
            $booking->vehicle?->update(['mileage' => $data['odometer'], 'fuel_level' => $data['fuel_level']]);
            AuditLog::record('booking.handover', "Handed over {$booking->reference} at {$data['odometer']} km, {$data['fuel_level']}% fuel"
                .($deposit ? ', deposit KSh '.number_format($deposit) : ''), $booking, actor: $actor);

            return $this->bookings->transition($booking, BookingStatus::Active);
        });
    }

    // ── Return ────────────────────────────────────────────────────────────────

    /**
     * What returning the car now would cost, before anything is saved.
     *
     * @return array{charges: list<array{type: string, description: string, amount: int, vat: int, total: int}>, charges_total: int, balance_after: int, deposit_held: int, deposit_to_apply: int, deposit_refund: int}
     */
    public function quoteReturn(Booking $booking, int $odometer, int $fuelLevel, int $damage = 0, ?string $damageDescription = null, ?CarbonInterface $returnedAt = null): array
    {
        $charges = $this->returnCharges($booking, $odometer, $fuelLevel, $damage, $damageDescription, $returnedAt ?? now());
        $chargesTotal = array_sum(array_column($charges, 'total'));
        $balanceAfter = ($booking->invoice?->balance() ?? $booking->total) + $chargesTotal;
        $held = $booking->depositHeld();
        $apply = min($held, $balanceAfter);

        return [
            'charges' => $charges,
            'charges_total' => $chargesTotal,
            'balance_after' => $balanceAfter,
            'deposit_held' => $held,
            'deposit_to_apply' => $apply,
            'deposit_refund' => $held - $apply,
        ];
    }

    /**
     * Take the car back: record its condition, add any charges to the invoice,
     * complete the booking and (unless held back) settle the deposit.
     *
     * @param  array{odometer: int, fuel_level: int, notes?: string|null, damage_amount?: int|null, damage_description?: string|null, settle_deposit?: bool, refund_method?: string|null, refund_reference?: string|null}  $data
     * @param  list<UploadedFile>  $photos
     */
    public function receiveReturn(User $actor, Booking $booking, array $data, array $photos = []): Booking
    {
        if ($booking->status !== BookingStatus::Active) {
            throw ValidationException::withMessages(['booking' => 'Only active rentals can be returned.']);
        }
        $pickup = $booking->inspections()->where('type', 'pickup')->first();
        if ($pickup && $data['odometer'] < $pickup->odometer) {
            throw ValidationException::withMessages(['odometer' => "The odometer can't be lower than at pickup ({$pickup->odometer} km)."]);
        }

        return DB::transaction(function () use ($actor, $booking, $data, $photos) {
            $this->inspect($actor, $booking, 'return', $data, $photos);
            $charges = $this->returnCharges($booking, $data['odometer'], $data['fuel_level'], (int) ($data['damage_amount'] ?? 0), $data['damage_description'] ?? null, now());
            foreach ($charges as $charge) {
                $booking->charges()->create([...$charge, 'created_by' => $actor->id]);
            }
            $booking->update(['returned_at' => now()]);
            $booking->vehicle?->update(['mileage' => $data['odometer'], 'fuel_level' => $data['fuel_level']]);
            $booking = $this->bookings->transition($booking, BookingStatus::Completed);
            $this->finance->addCharges($booking, $charges);
            AuditLog::record('booking.returned', "Took back {$booking->reference} at {$data['odometer']} km, {$data['fuel_level']}% fuel"
                .($charges ? '; charges KSh '.number_format(array_sum(array_column($charges, 'total'))) : ''), $booking, actor: $actor);

            if (($data['settle_deposit'] ?? true) && $booking->depositHeld() > 0) {
                $this->settleDeposit($actor, $booking->fresh(), $data['refund_method'] ?? null, $data['refund_reference'] ?? null);
            }

            return $booking->fresh();
        });
    }

    /**
     * Use the held deposit to pay what's owed, and record how the rest went back.
     */
    public function settleDeposit(User $actor, Booking $booking, ?string $refundMethod, ?string $refundReference): Booking
    {
        $held = $booking->depositHeld();
        if ($held === 0) {
            throw ValidationException::withMessages(['deposit' => 'There is no deposit left to settle.']);
        }
        if (! in_array($booking->status, [BookingStatus::Completed, BookingStatus::Cancelled], true)) {
            throw ValidationException::withMessages(['deposit' => 'Settle the deposit once the car is back.']);
        }

        return DB::transaction(function () use ($actor, $booking, $held, $refundMethod, $refundReference) {
            // A cancelled booking's deposit all goes back; otherwise it first covers what's owed.
            $owed = $booking->status === BookingStatus::Completed ? ($booking->invoice()->first()?->balance() ?? 0) : 0;
            $apply = min($held, $owed);
            $refund = $held - $apply;
            if ($refund > 0 && ! $refundMethod) {
                throw ValidationException::withMessages(['refund_method' => 'Say how the remaining KSh '.number_format($refund).' of the deposit was returned.']);
            }
            if ($apply > 0) {
                $this->finance->recordPayment($actor, $booking, ['amount' => $apply, 'method' => PaymentMethod::Deposit->value, 'notes' => 'Applied from the security deposit']);
            }
            $booking->update([
                'deposit_applied' => $booking->deposit_applied + $apply,
                'deposit_refunded' => $booking->deposit_refunded + $refund,
                'deposit_refund_method' => $refund > 0 ? $refundMethod : $booking->deposit_refund_method,
                'deposit_refund_reference' => $refund > 0 ? $refundReference : $booking->deposit_refund_reference,
                'deposit_settled_at' => now(),
            ]);
            AuditLog::record('booking.deposit_settled', "Deposit on {$booking->reference}: KSh ".number_format($apply).' applied, KSh '.number_format($refund).' returned', $booking, actor: $actor);
            if ($booking->customer && $refund > 0) {
                DB::afterCommit(fn () => $this->notifier->user($booking->customer, 'Deposit returned',
                    'KSh '.number_format($refund)." of your deposit on {$booking->reference} has been returned".($apply ? ' (KSh '.number_format($apply).' covered charges)' : '').'.',
                    '/customer-rentals', 'success', 'payment'));
            }

            return $booking->fresh();
        });
    }

    /**
     * Late return, fuel shortfall, extra mileage and damage, priced from the dealer's policy.
     * Amounts are before VAT, like daily rates.
     *
     * @return list<array{type: string, description: string, amount: int, vat: int, total: int}>
     */
    public function returnCharges(Booking $booking, int $odometer, int $fuelLevel, int $damage, ?string $damageDescription, CarbonInterface $returnedAt): array
    {
        $policy = $booking->dealer->policy();
        $pickup = $booking->inspections()->where('type', 'pickup')->first();
        $charges = [];

        $lateMinutes = $booking->return_at->copy()->addMinutes($policy['late_grace_minutes'])->diffInMinutes($returnedAt, false);
        if ($lateMinutes > 0) {
            $hours = (int) ceil($lateMinutes / 60);
            $hourly = (int) round($booking->daily_rate * $policy['late_fee_percent'] / 100);
            // Each full day late costs one day's rate; the hourly fee never exceeds a day either.
            $amount = intdiv($hours, 24) * $booking->daily_rate + min(($hours % 24) * $hourly, $booking->daily_rate);
            if ($amount > 0) {
                $charges[] = $this->charge('late', "Late return: {$hours} h after the agreed time (+{$policy['late_grace_minutes']} min grace)", $amount);
            }
        }
        if ($pickup && $fuelLevel < $pickup->fuel_level) {
            $short = $pickup->fuel_level - $fuelLevel;
            $charges[] = $this->charge('fuel', "Fuel: returned at {$fuelLevel}%, collected at {$pickup->fuel_level}% ({$short}% × KSh {$policy['fuel_charge_per_percent']})", $short * $policy['fuel_charge_per_percent']);
        }
        if ($pickup && $policy['included_km_per_day']) {
            $driven = $odometer - $pickup->odometer;
            $allowed = $booking->days * $policy['included_km_per_day'];
            if ($driven > $allowed) {
                $extra = $driven - $allowed;
                $charges[] = $this->charge('mileage', "Mileage: {$driven} km driven, {$allowed} km included ({$extra} km × KSh {$policy['extra_km_rate']})", $extra * $policy['extra_km_rate']);
            }
        }
        if ($damage > 0) {
            $charges[] = $this->charge('damage', 'Damage: '.($damageDescription ?: 'see return inspection'), $damage);
        }

        return $charges;
    }

    // ── Extensions ────────────────────────────────────────────────────────────

    public function requestExtension(User $customer, Booking $booking, CarbonInterface $newReturn): BookingExtension
    {
        if ($booking->extensions()->where('status', 'pending')->exists()) {
            throw ValidationException::withMessages(['return_at' => 'You already have an extension request waiting for the dealer.']);
        }
        if ($newReturn->lte($booking->return_at)) {
            throw ValidationException::withMessages(['return_at' => 'Choose a time after your current return time.']);
        }
        $maxDays = (int) Settings::get('max_booking_days');
        if ($booking->pickup_at->diffInMinutes($newReturn) > $maxDays * 24 * 60) {
            throw ValidationException::withMessages(['return_at' => "Bookings can be at most {$maxDays} days. Contact the dealer for longer hires."]);
        }
        $this->assertFree($booking, $newReturn);
        [$extraDays, $net, $vat] = $this->extensionPrice($booking, $newReturn);
        $amount = $net + $vat;

        $extension = $booking->extensions()->create([
            'requested_by' => $customer->id, 'from_return_at' => $booking->return_at, 'to_return_at' => $newReturn,
            'extra_days' => $extraDays, 'amount' => $amount,
        ]);
        AuditLog::record('booking.extension_requested', "{$booking->customer_name} asked to extend {$booking->reference} to {$newReturn->format('j M H:i')}", $booking, actor: $customer);
        $this->notifier->dealerStaff($booking->dealer_id, 'Extension requested',
            "{$booking->customer_name} wants to keep {$booking->reference} until {$newReturn->format('D j M, H:i')} (+KSh ".number_format($amount).').',
            '/dealer-booking', 'info', 'booking');

        return $extension;
    }

    public function decideExtension(User $actor, BookingExtension $extension, bool $approve, ?string $note = null): BookingExtension
    {
        if ($extension->status !== 'pending') {
            throw ValidationException::withMessages(['decision' => 'This request has already been answered.']);
        }

        return DB::transaction(function () use ($actor, $extension, $approve, $note) {
            $booking = Booking::lockForUpdate()->findOrFail($extension->booking_id);
            if ($approve) {
                $this->assertFree($booking, $extension->to_return_at);
                [$extraDays, $net, $vat] = $this->extensionPrice($booking, $extension->to_return_at);
                $amount = $net + $vat;
                $booking->update([
                    'return_at' => $extension->to_return_at,
                    'days' => $booking->days + $extraDays,
                    'subtotal' => $booking->subtotal + $net,
                    'vat' => $booking->vat + $vat,
                    'total' => $booking->total + $amount,
                    'return_reminded_at' => null,
                    'overdue_notified_at' => null,
                    'overdue_escalated_at' => null,
                ]);
                $this->finance->addToInvoice($booking, $net, $vat);
                $extension->fill(['extra_days' => $extraDays, 'amount' => $amount]);
            }
            $extension->update(['status' => $approve ? 'approved' : 'declined', 'decided_by' => $actor->id, 'decided_at' => now(), 'note' => $note]);
            AuditLog::record('booking.extension_'.($approve ? 'approved' : 'declined'), ($approve ? 'Extended ' : 'Declined extension of ')."{$booking->reference}".($approve ? " to {$extension->to_return_at->format('j M H:i')}" : ''), $booking, actor: $actor);

            $customer = $booking->customer;
            DB::afterCommit(fn () => $this->notifier->user($customer, $approve ? 'Extension approved' : 'Extension declined', $approve
                ? "You can keep the car until {$extension->to_return_at->format('D j M, H:i')}. KSh ".number_format($extension->amount).' has been added to your invoice.'
                : "{$booking->reference} still ends {$booking->return_at->format('D j M, H:i')}.".($note ? " The dealer said: {$note}" : ''),
                '/customer-active-trip', $approve ? 'success' : 'warning', 'booking', sms: true));

            return $extension;
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** @param list<UploadedFile> $photos */
    private function inspect(User $actor, Booking $booking, string $type, array $data, array $photos): BookingInspection
    {
        $paths = array_map(fn (UploadedFile $f) => $f->store("inspections/{$booking->id}", 'local'), $photos);

        return $booking->inspections()->updateOrCreate(['type' => $type], [
            'odometer' => $data['odometer'], 'fuel_level' => $data['fuel_level'], 'notes' => $data['notes'] ?? null,
            'photos' => $paths ?: null, 'recorded_by' => $actor->id,
        ]);
    }

    /** @return array{type: string, description: string, amount: int, vat: int, total: int} */
    private function charge(string $type, string $description, int $amount): array
    {
        $vat = (int) round($amount * (float) config('drivefleet.vat_rate'));

        return ['type' => $type, 'description' => $description, 'amount' => $amount, 'vat' => $vat, 'total' => $amount + $vat];
    }

    /** @return array{0: int, 1: int, 2: int} extra days, their price before VAT, and the VAT */
    private function extensionPrice(Booking $booking, CarbonInterface $newReturn): array
    {
        $days = Booking::quote($booking->daily_rate, $booking->pickup_at, Carbon::instance($newReturn))['days'];
        $extraDays = max(0, $days - $booking->days);
        $net = $extraDays * $booking->daily_rate;

        return [$extraDays, $net, (int) round($net * (float) config('drivefleet.vat_rate'))];
    }

    private function assertFree(Booking $booking, CarbonInterface $until): void
    {
        if ($booking->vehicle && $booking->vehicle->isBookedBetween($booking->return_at, $until, $booking->id)) {
            throw ValidationException::withMessages(['return_at' => 'The vehicle is booked by someone else in that time. Try an earlier return.']);
        }
    }
}
