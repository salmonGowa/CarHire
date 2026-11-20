<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['support_message_id', 'path', 'original_name', 'mime_type', 'size'])]
class SupportAttachment extends Model
{
    protected function casts(): array
    {
        return ['size' => 'integer'];
    }

    /** @return BelongsTo<SupportMessage, $this> */
    public function message(): BelongsTo
    {
        return $this->belongsTo(SupportMessage::class, 'support_message_id');
    }
}
