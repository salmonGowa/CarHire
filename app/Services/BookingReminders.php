<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Time-based messages about bookings, run by the scheduler. Each reminder is
 * sent once per booking (the *_at columns record that it went out).
 * Customers with an account get an in-app notification, email and SMS (per
 * their preferences); walk-in customers get an SMS to the number on the booking.
 */
class BookingReminders
{
    public const PICKUP_HOURS_AHEAD = 24;

    public const RETURN_HOURS_AHEAD = 3;

    public const OVERDUE_GRACE_MINUTES = 30;

    public function __construct(private Notifier $notifier) {}

    /** @return array{pickup: int, return: int, overdue: int} */
    public function send(): array
    {
        return [
            'pickup' => $this->pickupReminders(),
            'return' => $this->returnReminders(),
            'overdue' => $this->overdueAlerts(),
        ];
    }

    private function pickupReminders(): int
    {
        return $this->each(
            Booking::where('status', BookingStatus::Confirmed)->whereNull('pickup_reminded_at')
                ->whereBetween('pickup_at', [now(), now()->addHours(self::PICKUP_HOURS_AHEAD)]),
            'pickup_reminded_at',
            fn (Booking $b) => $this->tell($b, 'Pickup reminder',
                "Your {$this->vehicle($b)} is ready for pickup {$this->when($b->pickup_at)} at {$b->pickup_location}. Bring your ID and driving licence.",
                '/customer-active-trip', 'info'),
        );
    }

    private function returnReminders(): int
    {
        return $this->each(
            Booking::where('status', BookingStatus::Active)->whereNull('return_reminded_at')
                ->whereBetween('return_at', [now(), now()->addHours(self::RETURN_HOURS_AHEAD)]),
            'return_reminded_at',
            fn (Booking $b) => $this->tell($b, 'Return reminder',
                "Please return the {$this->vehicle($b)} by {$this->when($b->return_at)}. Need longer? Call {$this->dealerName($b)} before then.",
                '/customer-active-trip', 'info'),
        );
    }

    private function overdueAlerts(): int
    {
        return $this->each(
            Booking::where('status', BookingStatus::Active)->whereNull('overdue_notified_at')
                ->where('return_at', '<', now()->subMinutes(self::OVERDUE_GRACE_MINUTES)),
            'overdue_notified_at',
            function (Booking $b) {
                $this->tell($b, 'Your rental is overdue',
                    "The {$this->vehicle($b)} was due back {$this->when($b->return_at)}. Please return it or call {$this->dealerName($b)} to extend.",
                    '/customer-active-trip', 'warning');
                $this->notifier->dealerStaff($b->dealer_id, 'Overdue return',
                    "{$b->reference}: {$b->customer_name} hasn't returned the {$this->vehicle($b)} (due {$this->when($b->return_at)}).",
                    '/dealer-booking', 'warning', 'booking');
            },
        );
    }

    /**
     * Claim each booking (set its *_at column) before notifying, so two
     * overlapping scheduler runs can't send the same reminder twice.
     *
     * @param  Builder<Booking>  $query
     */
    private function each($query, string $column, callable $notify): int
    {
        $sent = 0;
        foreach ($query->with(['vehicle', 'dealer', 'customer'])->get() as $booking) {
            $claimed = DB::table('bookings')->where('id', $booking->id)->whereNull($column)->update([$column => now()]);
            if ($claimed) {
                $notify($booking);
                $sent++;
            }
        }

        return $sent;
    }

    private function tell(Booking $b, string $title, string $body, string $link, string $tone): void
    {
        if ($b->customer) {
            $this->notifier->user($b->customer, $title, $body, $link, $tone, 'booking', sms: true);
        } else {
            $this->notifier->smsOnly($b->customer_phone, $title, $body);
        }
    }

    private function vehicle(Booking $b): string
    {
        return $b->vehicle ? "{$b->vehicle->model} ({$b->vehicle->plate})" : 'vehicle';
    }

    private function dealerName(Booking $b): string
    {
        return $b->dealer ? $b->dealer->name.($b->dealer->phone ? " on {$b->dealer->phone}" : '') : 'the dealer';
    }

    private function when(\DateTimeInterface $at): string
    {
        $at = Carbon::instance($at);

        return match (true) {
            $at->isToday() => 'today at '.$at->format('H:i'),
            $at->isTomorrow() => 'tomorrow at '.$at->format('H:i'),
            default => $at->format('D j M, H:i'),
        };
    }
}
