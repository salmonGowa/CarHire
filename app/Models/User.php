<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name', 'email', 'password', 'role', 'phone', 'company', 'dealer_id', 'job_title', 'alt_phone', 'national_id', 'kra_pin',
    'date_of_birth', 'gender', 'address', 'county', 'kyc_status', 'kyc_reviewed_at', 'kyc_reviewed_by', 'kyc_note',
    'flagged_at', 'admin_notes', 'disabled_at', 'last_login_at',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'date_of_birth' => 'date',
            'kyc_reviewed_at' => 'datetime',
            'flagged_at' => 'datetime',
            'disabled_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Dealer, $this> */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /** @return BelongsTo<User, $this> */
    public function kycReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kyc_reviewed_by');
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'customer_id');
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'customer_id');
    }

    /** @return BelongsToMany<Vehicle, $this> */
    public function savedVehicles(): BelongsToMany
    {
        return $this->belongsToMany(Vehicle::class, 'saved_vehicles')->withTimestamps();
    }

    public function isDisabled(): bool
    {
        return $this->disabled_at !== null;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === UserRole::SuperAdmin;
    }

    /**
     * Dealer staff who belong to a dealership. A dealer account without one
     * can sign in but has no fleet to manage.
     */
    public function isDealer(): bool
    {
        return $this->role === UserRole::Dealer;
    }

    /**
     * The fields the React app receives about the signed-in user.
     *
     * @return array{id: int, name: string, email: string, role: string, dealer: array{id: int, name: string}|null}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'dealer' => $this->dealer ? ['id' => $this->dealer->id, 'name' => $this->dealer->name] : null,
        ];
    }
}
