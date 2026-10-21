<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\VehicleStatus;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Promotion;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(private FinanceService $finance) {}

    /**
     * Create a booking after checking the vehicle is free. The vehicle row is
     * locked so two people can't book the same dates at the same moment.
     *
     * @param  array<string, mixed>  $data  validated StoreBookingRequest data
     */
    public function create(User $actor, array $data): Booking
    {
        $pickupAt = Carbon::parse($data['pickup_at']);
        $returnAt = Carbon::parse($data['return_at']);
        $staff = $actor->isDealer() || $actor->isSuperAdmin();

        return DB::transaction(function () use ($actor, $data, $pickupAt, $returnAt, $staff) {
            /** @var Vehicle $vehicle */
            $vehicle = Vehicle::query()->with('dealer')->lockForUpdate()->findOrFail($data['vehicle_id']);

            if ($actor->isDealer() && $vehicle->dealer_id !== $actor->dealer_id) {
                throw ValidationException::withMessages(['vehicle_id' => 'You can only book vehicles from your own fleet.']);
            }

            if (! $staff && ! Vehicle::bookable()->whereKey($vehicle->id)->exists()) {
                throw ValidationException::withMessages(['vehicle_id' => 'This vehicle is not available for booking.']);
            }

            if ($vehicle->status === VehicleStatus::Maintenance) {
                throw ValidationException::withMessages(['vehicle_id' => 'This vehicle is in maintenance.']);
            }

            if ($vehicle->isBookedBetween($pickupAt, $returnAt)) {
                throw ValidationException::withMessages(['vehicle_id' => 'This vehicle is already booked for those dates.']);
            }

            $promotion = filled($data['promo_code'] ?? null)
                ? $this->redeemablePromotion($vehicle->dealer_id, $data['promo_code'], lock: true)
                : null;

            $booking = Booking::create([
                ...Booking::quote($vehicle->daily_rate, $pickupAt, $returnAt, $promotion),
                'promotion_id' => $promotion?->id,
                'dealer_id' => $vehicle->dealer_id,
                'vehicle_id' => $vehicle->id,
                'created_by' => $actor->id,
                'customer_id' => $staff ? null : $actor->id,
                'customer_name' => $staff ? $data['customer_name'] : $actor->name,
                'customer_email' => $staff ? ($data['customer_email'] ?? null) : $actor->email,
                'customer_phone' => $staff ? $data['customer_phone'] : $actor->phone,
                'customer_id_number' => $staff ? $data['customer_id_number'] : null,
                'pickup_at' => $pickupAt,
                'return_at' => $returnAt,
                'pickup_location' => $data['pickup_location'],
                'payment_method' => $data['payment_method'] ?? null,
                // Staff bookings are made with the client present, so they start confirmed.
                'status' => $staff ? BookingStatus::Confirmed : BookingStatus::Pending,
            ]);

            if ($booking->status === BookingStatus::Confirmed) {
                $this->finance->issueInvoice($booking);
            }

            AuditLog::record('booking.created', "Booking {$booking->reference} for {$booking->customer_name} on {$vehicle->plate}", $booking, actor: $actor);

            return $booking;
        });
    }

    /**
     * A dealer's promo code, if it can be used right now. The row is locked
     * while booking so two customers can't both take the last redemption.
     */
    public function redeemablePromotion(int $dealerId, string $code, bool $lock = false): Promotion
    {
        $promotion = Promotion::query()
            ->where('dealer_id', $dealerId)
            ->where('code', strtoupper(trim($code)))
            ->when($lock, fn ($q) => $q->lockForUpdate())
            ->first();

        $reason = match ($promotion?->status()) {
            null => "That code isn't valid for this dealer.",
            'expired' => 'That code has expired.',
            'used_up' => 'That code has been fully redeemed.',
            'paused' => "That code isn't active right now.",
            default => null,
        };

        if ($reason) {
            throw ValidationException::withMessages(['promo_code' => $reason]);
        }

        return $promotion;
    }

    /**
     * Move a booking to its next status and keep the vehicle's status in step.
     */
    public function transition(Booking $booking, BookingStatus $next): Booking
    {
        if (! $booking->status->canTransitionTo($next)) {
            throw ValidationException::withMessages([
                'status' => "A {$booking->status->value} booking can't be marked {$next->value}.",
            ]);
        }

        return DB::transaction(function () use ($booking, $next) {
            $booking->status = $next;
            if ($next === BookingStatus::Cancelled) {
                $booking->cancelled_at = now();
            }
            $booking->save();

            if ($next === BookingStatus::Confirmed) {
                $this->finance->issueInvoice($booking);
            }
            if ($next === BookingStatus::Cancelled) {
                $this->finance->voidIfUnpaid($booking);
            }

            AuditLog::record("booking.{$next->value}", "Booking {$booking->reference} marked {$next->value}", $booking);

            $vehicle = $booking->vehicle()->lockForUpdate()->first();

            if ($vehicle && $next === BookingStatus::Active) {
                $vehicle->update(['status' => VehicleStatus::Rented]);
            }

            if ($vehicle && in_array($next, [BookingStatus::Completed, BookingStatus::Cancelled], true)
                && $vehicle->status === VehicleStatus::Rented
                && ! $vehicle->bookings()->where('status', BookingStatus::Active)->exists()) {
                $vehicle->update(['status' => VehicleStatus::Available]);
            }

            return $booking;
        });
    }
}
