<?php

namespace App\Policies;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Support\Settings;

class BookingPolicy
{
    public function view(User $user, Booking $booking): bool
    {
        return $this->manages($user, $booking) || $booking->customer_id === $user->id;
    }

    /**
     * Dealers and super admins run the full lifecycle; customers may only
     * cancel their own booking before the rental starts.
     */
    public function changeStatus(User $user, Booking $booking, BookingStatus $next): bool
    {
        if (! $booking->status->canTransitionTo($next)) {
            return false;
        }

        if ($this->manages($user, $booking)) {
            return true;
        }

        // Customers cancel themselves only up to the cut-off before pickup; after that the dealer decides.
        return $booking->customer_id === $user->id
            && $next === BookingStatus::Cancelled
            && now()->addHours((int) Settings::get('free_cancellation_hours'))->lte($booking->pickup_at);
    }

    public function rate(User $user, Booking $booking): bool
    {
        return $booking->customer_id === $user->id && $booking->status === BookingStatus::Completed;
    }

    /**
     * Staff record money received once the booking is confirmed.
     */
    public function recordPayment(User $user, Booking $booking): bool
    {
        return $this->manages($user, $booking)
            && in_array($booking->status, [BookingStatus::Confirmed, BookingStatus::Active, BookingStatus::Completed], true);
    }

    private function manages(User $user, Booking $booking): bool
    {
        return $user->isSuperAdmin() || ($user->isDealer() && $user->dealer_id === $booking->dealer_id);
    }
}
