<?php

namespace App\Models;

use App\Enums\PayoutStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'reference', 'dealer_id', 'period_start', 'period_end', 'payment_count', 'gross_collected',
    'cash_collected', 'commission', 'net', 'status', 'paid_at', 'transfer_reference', 'created_by',
])]
class Payout extends Model
{
    protected static function booted(): void
    {
        static::creating(function (Payout $payout) {
            $payout->reference ??= 'PO-'.Str::upper(Str::random(6));
        });
    }

    protected function casts(): array
    {
        return [
            'status' => PayoutStatus::class,
            'period_start' => 'date',
            'period_end' => 'date',
            'paid_at' => 'datetime',
            'gross_collected' => 'integer',
            'cash_collected' => 'integer',
            'commission' => 'integer',
            'net' => 'integer',
        ];
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
}
