<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\DealerStatus;
use App\Enums\VehicleStatus;
use Carbon\CarbonInterface;
use Database\Factories\VehicleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['dealer_id', 'model', 'plate', 'type', 'year', 'seats', 'transmission', 'fuel_type', 'daily_rate', 'mileage', 'fuel_level', 'status', 'location', 'image_url'])]
class Vehicle extends Model
{
    /** @use HasFactory<VehicleFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => VehicleStatus::class,
            'daily_rate' => 'integer',
            'mileage' => 'integer',
            'fuel_level' => 'integer',
        ];
    }

    /** @return BelongsTo<Dealer, $this> */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /** @return BelongsToMany<User, $this> */
    public function savedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'saved_vehicles')->withTimestamps();
    }

    /**
     * Vehicles customers can see in the catalogue: from an active dealer and
     * not in the workshop.
     *
     * @param  Builder<Vehicle>  $query
     */
    public function scopeBookable(Builder $query): void
    {
        $query->where('status', '!=', VehicleStatus::Maintenance)
            ->whereHas('dealer', fn (Builder $q) => $q->where('status', DealerStatus::Active));
    }

    /**
     * Whether another booking already holds this vehicle for any part of the range.
     */
    public function isBookedBetween(CarbonInterface $from, CarbonInterface $to, ?int $ignoreBookingId = null): bool
    {
        return $this->bookings()
            ->whereIn('status', BookingStatus::blocking())
            ->when($ignoreBookingId, fn (Builder $q) => $q->whereKeyNot($ignoreBookingId))
            ->where('pickup_at', '<', $to)
            ->where('return_at', '>', $from)
            ->exists();
    }
}
