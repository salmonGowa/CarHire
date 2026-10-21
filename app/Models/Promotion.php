<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['dealer_id', 'code', 'type', 'value', 'max_uses', 'expires_on', 'is_active'])]
class Promotion extends Model
{
    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'max_uses' => 'integer',
            'expires_on' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /** Redemptions: bookings that used the code and weren't cancelled. */
    public function usedCount(): int
    {
        return $this->bookings()->where('status', '!=', BookingStatus::Cancelled)->count();
    }

    public function status(?int $used = null): string
    {
        $used ??= $this->usedCount();

        return match (true) {
            $this->expires_on->endOfDay()->isPast() => 'expired',
            $this->max_uses !== null && $used >= $this->max_uses => 'used_up',
            ! $this->is_active => 'paused',
            default => 'active',
        };
    }

    /** Discount on a pre-VAT amount, never more than the amount itself. */
    public function discountOn(int $amount): int
    {
        $discount = $this->type === 'percentage'
            ? (int) round($amount * min($this->value, 100) / 100)
            : $this->value;

        return min($discount, $amount);
    }
}
