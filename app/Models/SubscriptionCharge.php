<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'reference', 'dealer_id', 'subscription_plan_id', 'plan_name', 'amount', 'period_start', 'period_end', 'due_on',
    'status', 'method', 'transaction_ref', 'paid_at', 'recorded_by',
])]
class SubscriptionCharge extends Model
{
    protected static function booted(): void
    {
        static::created(function (SubscriptionCharge $charge) {
            $charge->reference ??= 'SUB-'.$charge->period_start->format('Ym').'-'.str_pad((string) $charge->id, 4, '0', STR_PAD_LEFT);
            $charge->saveQuietly();
        });
    }

    protected function casts(): array
    {
        return [
            'amount' => 'integer', 'period_start' => 'date', 'period_end' => 'date', 'due_on' => 'date',
            'paid_at' => 'datetime', 'method' => PaymentMethod::class,
        ];
    }

    /** @return BelongsTo<Dealer, $this> */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    public function state(): string
    {
        return $this->status === 'pending' && $this->due_on->lt(today()) ? 'overdue' : $this->status;
    }
}
