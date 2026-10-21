<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable(['dealer_id', 'name', 'phone', 'license_class', 'license_number', 'license_expires_on', 'is_active', 'joined_on', 'photo_url', 'license_image_url'])]
class Driver extends Model
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'joined_on' => 'date',
            'license_expires_on' => 'date',
        ];
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function isBookedBetween(Carbon $from, Carbon $to, ?int $ignoreBookingId = null): bool
    {
        return $this->bookings()
            ->whereIn('status', BookingStatus::blocking())
            ->when($ignoreBookingId, fn ($q) => $q->whereKeyNot($ignoreBookingId))
            ->where('pickup_at', '<', $to)
            ->where('return_at', '>', $from)
            ->exists();
    }
}
