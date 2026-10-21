<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Carbon\CarbonInterface;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[Fillable([
    'reference', 'dealer_id', 'vehicle_id', 'customer_id', 'created_by', 'driver_id', 'promotion_id', 'discount',
    'agreement_type', 'agreement_signed_at', 'review', 'rated_at', 'review_reply', 'replied_at',
    'customer_name', 'customer_email', 'customer_phone', 'customer_id_number',
    'pickup_at', 'return_at', 'pickup_location', 'days', 'daily_rate', 'subtotal', 'vat', 'total',
    'payment_method', 'status', 'rating', 'cancelled_at',
])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Booking $booking) {
            $booking->reference ??= static::newReference();
        });
    }

    protected function casts(): array
    {
        return [
            'status' => BookingStatus::class,
            'pickup_at' => 'datetime',
            'return_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'agreement_signed_at' => 'datetime',
            'rated_at' => 'datetime',
            'replied_at' => 'datetime',
            'discount' => 'integer',
            'daily_rate' => 'integer',
            'subtotal' => 'integer',
            'vat' => 'integer',
            'total' => 'integer',
            'rating' => 'integer',
        ];
    }

    public static function newReference(): string
    {
        do {
            $reference = 'BKG-'.Str::upper(Str::random(6));
        } while (static::where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * Rental days are charged per started 24 hours, with a one-day minimum.
     * A promotion comes off before VAT.
     *
     * @return array{days: int, daily_rate: int, discount: int, subtotal: int, vat: int, total: int}
     */
    public static function quote(int $dailyRate, CarbonInterface $pickupAt, CarbonInterface $returnAt, ?Promotion $promotion = null): array
    {
        $days = max(1, (int) ceil($pickupAt->diffInMinutes($returnAt) / (60 * 24)));
        $gross = $dailyRate * $days;
        $discount = $promotion?->discountOn($gross) ?? 0;
        $subtotal = $gross - $discount;
        $vat = (int) round($subtotal * (float) config('drivefleet.vat_rate'));

        return [
            'days' => $days,
            'daily_rate' => $dailyRate,
            'discount' => $discount,
            'subtotal' => $subtotal,
            'vat' => $vat,
            'total' => $subtotal + $vat,
        ];
    }

    /** @return BelongsTo<Dealer, $this> */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class)->withTrashed();
    }

    /** @return HasOne<Invoice, $this> */
    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return BelongsTo<Driver, $this> */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /** @return BelongsTo<Promotion, $this> */
    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }

    /** @return BelongsTo<User, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    /**
     * Limit a query to the bookings the given user is allowed to see.
     *
     * @param  Builder<Booking>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        match (true) {
            $user->isSuperAdmin() => null,
            $user->isDealer() => $query->where('dealer_id', $user->dealer_id),
            default => $query->where('customer_id', $user->id),
        };
    }

    /**
     * An active rental whose return time has passed.
     */
    public function isOverdue(): bool
    {
        return $this->status === BookingStatus::Active && $this->return_at->isPast();
    }
}
