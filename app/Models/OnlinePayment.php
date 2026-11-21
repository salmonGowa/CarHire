<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * An attempt to collect money online: an M-PESA STK prompt or a card checkout.
 */
#[Fillable([
    'reference', 'booking_id', 'invoice_id', 'dealer_id', 'customer_id', 'initiated_by', 'provider', 'driver',
    'amount', 'phone', 'email', 'status', 'checkout_id', 'merchant_request_id', 'receipt', 'result_code',
    'result_desc', 'payment_id', 'payload', 'last_checked_at', 'completed_at',
])]
class OnlinePayment extends Model
{
    public const PENDING = 'pending';

    public const SUCCEEDED = 'succeeded';

    public const FAILED = 'failed';

    public const CANCELLED = 'cancelled';

    public const EXPIRED = 'expired';

    /** How long a customer has to answer an M-PESA prompt or finish a card checkout. */
    public const EXPIRES_AFTER_MINUTES = ['mpesa' => 5, 'card' => 60];

    protected static function booted(): void
    {
        static::creating(function (OnlinePayment $p) {
            $p->reference ??= 'OLP-'.Str::upper(Str::random(10));
        });
    }

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'payload' => 'array',
            'last_checked_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function isPending(): bool
    {
        return $this->status === self::PENDING;
    }

    public function isExpired(): bool
    {
        return $this->isPending() && $this->created_at->copy()->addMinutes(self::EXPIRES_AFTER_MINUTES[$this->provider] ?? 10)->isPast();
    }

    /** @param  Builder<OnlinePayment>  $query */
    public function scopePending(Builder $query): void
    {
        $query->where('status', self::PENDING);
    }
}
