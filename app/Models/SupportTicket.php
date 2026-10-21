<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'reference', 'user_id', 'dealer_id', 'booking_id', 'subject', 'category', 'priority', 'status', 'assigned_to',
    'first_response_at', 'resolved_at', 'last_activity_at',
])]
class SupportTicket extends Model
{
    public const CATEGORIES = ['Booking', 'Payment & Billing', 'Vehicle Issue', 'Roadside Assistance', 'Account', 'Complaint', 'Payouts', 'Other'];

    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    public const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

    protected static function booted(): void
    {
        static::created(function (SupportTicket $ticket) {
            $ticket->reference ??= 'TKT-'.str_pad((string) $ticket->id, 5, '0', STR_PAD_LEFT);
            $ticket->saveQuietly();
        });
    }

    protected function casts(): array
    {
        return ['first_response_at' => 'datetime', 'resolved_at' => 'datetime', 'last_activity_at' => 'datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Dealer, $this> */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /** @return HasMany<SupportMessage, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(SupportMessage::class)->orderBy('created_at')->orderBy('id');
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'in_progress'], true);
    }
}
