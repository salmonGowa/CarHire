<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'dealer_id', 'type', 'status', 'due_on', 'expires_on', 'path', 'original_name', 'mime_type', 'size', 'notes', 'review_note',
    'requested_by', 'uploaded_by', 'submitted_at', 'reviewed_by', 'reviewed_at',
])]
class DealerDocument extends Model
{
    public const TYPES = [
        'KRA PIN Certificate', 'Certificate of Incorporation', 'County Business Permit', 'NTSA PSV / Fleet Licence',
        'Comprehensive Insurance', 'Director ID / KYC', 'Tax Compliance Certificate', 'Other',
    ];

    /** Every active dealer needs a valid copy of each of these. */
    public const REQUIRED = ['KRA PIN Certificate', 'County Business Permit', 'NTSA PSV / Fleet Licence', 'Comprehensive Insurance'];

    /** Verified documents this close to expiry need renewing. */
    public const EXPIRY_WARNING_DAYS = 30;

    protected function casts(): array
    {
        return ['due_on' => 'date', 'expires_on' => 'date', 'submitted_at' => 'datetime', 'reviewed_at' => 'datetime', 'size' => 'integer'];
    }

    /** @return BelongsTo<Dealer, $this> */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** Verified and not yet expired. */
    public function isValid(): bool
    {
        return in_array($this->state(), ['verified', 'expiring'], true);
    }

    /** Waiting on the dealer (requested/rejected) or on review (submitted). */
    public function isOpen(): bool
    {
        return in_array($this->status, ['requested', 'submitted', 'rejected'], true);
    }

    /**
     * What the compliance board shows: the stored status, refined by dates
     * (an expired licence or an unmet deadline needs action).
     */
    public function state(): string
    {
        return match (true) {
            $this->status === 'superseded' => 'superseded',
            $this->status === 'verified' && $this->expires_on?->lt(today()) => 'expired',
            $this->status === 'verified' && $this->expires_on?->lte(today()->addDays(self::EXPIRY_WARNING_DAYS)) => 'expiring',
            $this->status === 'verified' => 'verified',
            $this->status === 'submitted' => 'pending_review',
            $this->status === 'rejected' => 'rejected',
            $this->due_on?->lt(today()) => 'overdue',
            default => 'requested',
        };
    }
}
