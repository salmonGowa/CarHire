<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['number', 'booking_id', 'dealer_id', 'customer_id', 'customer_name', 'issued_at', 'subtotal', 'vat', 'total', 'amount_paid', 'voided_at'])]
class Invoice extends Model
{
    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
            'voided_at' => 'datetime',
            'subtotal' => 'integer',
            'vat' => 'integer',
            'total' => 'integer',
            'amount_paid' => 'integer',
        ];
    }

    /**
     * Sequential per year, e.g. INV-2026-00042.
     */
    public static function nextNumber(): string
    {
        $year = now()->year;
        $prefix = "INV-{$year}-";
        $last = static::where('number', 'like', $prefix.'%')->lockForUpdate()->max('number');
        $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $next, 5, '0', STR_PAD_LEFT);
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /** @return BelongsTo<Dealer, $this> */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function balance(): int
    {
        return max(0, $this->total - $this->amount_paid);
    }

    public function status(): string
    {
        return match (true) {
            $this->voided_at !== null => 'void',
            $this->amount_paid >= $this->total => 'paid',
            $this->amount_paid > 0 => 'partial',
            default => 'unpaid',
        };
    }

    public function refreshAmountPaid(): void
    {
        $this->update(['amount_paid' => (int) $this->payments()->where('status', PaymentStatus::Completed)->sum('amount')]);
    }

    /**
     * @param  Builder<Invoice>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        match (true) {
            $user->isSuperAdmin() => null,
            $user->isDealer() => $query->where('dealer_id', $user->dealer_id),
            default => $query->where('customer_id', $user->id),
        };
    }
}
