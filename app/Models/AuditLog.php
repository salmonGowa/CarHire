<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable(['user_id', 'actor', 'action', 'description', 'severity', 'subject_type', 'subject_id', 'ip_address', 'created_at'])]
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return MorphTo<Model, $this> */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Record an action by the current user (or "System" when there is none).
     */
    public static function record(string $action, string $description, ?Model $subject = null, string $severity = 'info', ?User $actor = null): self
    {
        $actor ??= auth()->user();
        $label = $actor
            ? $actor->email.($actor->isDealer() && $actor->dealer ? " ({$actor->dealer->name})" : '')
            : 'System';

        return static::create([
            'user_id' => $actor?->id,
            'actor' => $label,
            'action' => $action,
            'description' => $description,
            'severity' => $severity,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'ip_address' => request()?->ip(),
            'created_at' => now(),
        ]);
    }
}
