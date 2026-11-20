<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'type', 'path', 'original_name', 'mime_type', 'size'])]
class UserDocument extends Model
{
    public const TYPES = [
        'id_front' => 'National ID (front)',
        'id_back' => 'National ID (back)',
        'passport' => 'Passport',
        'driving_licence' => 'Driving licence',
    ];

    protected function casts(): array
    {
        return ['size' => 'integer'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
