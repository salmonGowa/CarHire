<?php

namespace App\Models;

use App\Enums\DealerStatus;
use Database\Factories\DealerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'city', 'county', 'address', 'phone', 'email', 'website', 'status', 'tier', 'license_no', 'tax_pin', 'notes',
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
}
