<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PayoutStatus;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinanceService
{
    /**
     * Issue the booking's tax invoice once (idempotent).
     */
    public function issueInvoice(Booking $booking): Invoice
    {
        return DB::transaction(fn () => $booking->invoice()->first() ?? Invoice::create([
            'number' => Invoice::nextNumber(),
            'booking_id' => $booking->id,
            'dealer_id' => $booking->dealer_id,
            'customer_id' => $booking->customer_id,
            'customer_name' => $booking->customer_name,
            'issued_at' => now(),
            'subtotal' => $booking->subtotal,
            'vat' => $booking->vat,
            'total' => $booking->total,
        ]));
    }

    /**
     * A cancelled booking's invoice is voided unless money was taken; then it
     * stays open so staff can refund against it.
     */
    public function voidIfUnpaid(Booking $booking): void
    {
        $invoice = $booking->invoice()->first();
        if ($invoice && $invoice->amount_paid === 0 && $invoice->voided_at === null) {
            $invoice->update(['voided_at' => now()]);
        }
    }

    /**
     * Record money received against a booking (cash, M-PESA code, card or bank transfer).
     *
     * @param  array{amount: int, method: string, transaction_code?: string|null, paid_at?: string|null, notes?: string|null}  $data
     */
    public function recordPayment(User $actor, Booking $booking, array $data): Payment
    {
        return DB::transaction(function () use ($actor, $booking, $data) {
            if ($booking->status === BookingStatus::Cancelled || $booking->status === BookingStatus::Pending) {
                throw ValidationException::withMessages(['amount' => 'Payments can only be recorded for confirmed, active or completed bookings.']);
            }

            $invoice = $this->issueInvoice($booking);
            $invoice = Invoice::whereKey($invoice->id)->lockForUpdate()->first();

            if ($data['amount'] > $invoice->balance()) {
                throw ValidationException::withMessages([
                    'amount' => 'That is more than the balance due ('.number_format($invoice->balance()).').',
                ]);
            }

            $payment = Payment::create([
                ...Payment::split($data['amount']),
                'invoice_id' => $invoice->id,
                'booking_id' => $booking->id,
                'dealer_id' => $booking->dealer_id,
                'customer_id' => $booking->customer_id,
                'amount' => $data['amount'],
                'method' => $data['method'],
                'transaction_code' => $data['transaction_code'] ?? null,
                'status' => PaymentStatus::Completed,
                'paid_at' => isset($data['paid_at']) ? Carbon::parse($data['paid_at']) : now(),
                'recorded_by' => $actor->id,
                'notes' => $data['notes'] ?? null,
            ]);

            $invoice->refreshAmountPaid();
            AuditLog::record('payment.recorded', 'Recorded KSh '.number_format($payment->amount)." ({$payment->method->value}) on {$booking->reference}", $payment, actor: $actor);

            return $payment;
        });
    }

    public function refund(Payment $payment): Payment
    {
        if ($payment->status === PaymentStatus::Refunded) {
            throw ValidationException::withMessages(['payment' => 'This payment was already refunded.']);
        }
        if ($payment->payout_id !== null) {
            throw ValidationException::withMessages(['payment' => 'This payment is part of a payout already; adjust it with the platform team.']);
        }

        return DB::transaction(function () use ($payment) {
            $payment->update(['status' => PaymentStatus::Refunded, 'refunded_at' => now()]);
            AuditLog::record('payment.refunded', 'Refunded KSh '.number_format($payment->amount)." ({$payment->reference})", $payment, 'warning');
            $payment->invoice->refreshAmountPaid();

            if ($payment->booking->status === BookingStatus::Cancelled) {
                $this->voidIfUnpaid($payment->booking);
            }

            return $payment;
        });
    }

    /**
     * Group every unsettled completed payment up to `$until` into one pending
     * payout per dealer.
     *
     * @return Collection<int, Payout>
     */
    public function generatePayouts(User $actor, Carbon $until): Collection
    {
        return DB::transaction(function () use ($actor, $until) {
            $payments = Payment::query()
                ->where('status', PaymentStatus::Completed)
                ->whereNull('payout_id')
                ->where('paid_at', '<=', $until)
                ->lockForUpdate()
                ->get()
                ->groupBy('dealer_id');

            return $payments->map(function (Collection $group, int $dealerId) use ($actor) {
                $platform = $group->filter(fn (Payment $p) => $p->method->collectedByPlatform());
                $gross = (int) $platform->sum('amount');
                $commission = (int) $group->sum('commission');

                $payout = Payout::create([
                    'dealer_id' => $dealerId,
                    'period_start' => $group->min('paid_at'),
                    'period_end' => $group->max('paid_at'),
                    'payment_count' => $group->count(),
                    'gross_collected' => $gross,
                    'cash_collected' => (int) $group->filter(fn (Payment $p) => $p->method === PaymentMethod::Cash)->sum('amount'),
                    'commission' => $commission,
                    'net' => $gross - $commission,
                    'status' => PayoutStatus::Pending,
                    'created_by' => $actor->id,
                ]);

                Payment::whereIn('id', $group->pluck('id'))->update(['payout_id' => $payout->id]);
                AuditLog::record('payout.created', "Payout {$payout->reference} created: KSh ".number_format($payout->net).' net', $payout, actor: $actor);

                return $payout;
            })->values();
        });
    }

    public function markPaid(Payout $payout, string $transferReference): Payout
    {
        if ($payout->status === PayoutStatus::Paid) {
            throw ValidationException::withMessages(['payout' => 'This payout is already marked paid.']);
        }

        AuditLog::record('payout.paid', "Payout {$payout->reference} paid (ref {$transferReference})", $payout);

        $payout->update([
            'status' => PayoutStatus::Paid,
            'paid_at' => now(),
            'transfer_reference' => $transferReference,
        ]);

        return $payout;
    }
}
