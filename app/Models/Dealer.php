<?php

namespace App\Models;

use App\Enums\DealerStatus;
use Database\Factories\DealerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'city', 'county', 'address', 'phone', 'email', 'website', 'status', 'tier', 'subscription_plan_id', 'license_no', 'tax_pin', 'notes',
    'owner_name', 'owner_phone', 'owner_email', 'owner_national_id', 'manager_name', 'manager_phone', 'manager_email',
])]
class Dealer extends Model
{
    /** @use HasFactory<DealerFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => DealerStatus::class,
        ];
    }

    /** @return HasMany<Vehicle, $this> */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /** @return HasMany<User, $this> */
    public function staff(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** @return BelongsTo<SubscriptionPlan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    /** @return HasMany<DealerDocument, $this> */
    public function documents(): HasMany
    {
        return $this->hasMany(DealerDocument::class);
    }

    /** @return HasMany<SubscriptionCharge, $this> */
    public function subscriptionCharges(): HasMany
    {
        return $this->hasMany(SubscriptionCharge::class);
    }

    /** Whether the dealer's plan leaves room for another vehicle. */
    public function canAddVehicle(): bool
    {
        $limit = $this->plan?->vehicle_limit;

        return $limit === null || $this->vehicles()->count() < $limit;
    }
}
