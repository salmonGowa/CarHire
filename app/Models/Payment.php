<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Support\Settings;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'reference', 'invoice_id', 'booking_id', 'dealer_id', 'customer_id', 'amount', 'vat', 'commission',
    'method', 'transaction_code', 'status', 'paid_at', 'refunded_at', 'recorded_by', 'payout_id', 'notes',
])]
class Payment extends Model
{
    protected static function booted(): void
    {
        static::creating(function (Payment $payment) {
            $payment->reference ??= 'PAY-'.Str::upper(Str::random(8));
        });
    }

    protected function casts(): array
    {
        return [
            'method' => PaymentMethod::class,
            'status' => PaymentStatus::class,
            'paid_at' => 'datetime',
            'refunded_at' => 'datetime',
            'amount' => 'integer',
            'vat' => 'integer',
            'commission' => 'integer',
        ];
    }

    /**
     * Split a VAT-inclusive amount into its VAT portion and the platform fee
     * (charged on the pre-VAT amount, so the platform never takes a cut of tax).
     *
     * @return array{vat: int, commission: int}
     */
    public static function split(int $amount): array
    {
        $vatRate = (float) config('drivefleet.vat_rate');
        $vat = (int) round($amount * $vatRate / (1 + $vatRate));
        $commission = (int) round(($amount - $vat) * (float) Settings::get('commission_rate'));

        return ['vat' => $vat, 'commission' => $commission];
    }

    /** What the dealer keeps after VAT and the platform fee. */
    public function dealerNet(): int
    {
        return $this->amount - $this->vat - $this->commission;
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
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

    /** @return BelongsTo<Payout, $this> */
    public function payout(): BelongsTo
    {
        return $this->belongsTo(Payout::class);
    }

    /**
     * @param  Builder<Payment>  $query
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
