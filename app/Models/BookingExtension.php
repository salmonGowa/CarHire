<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['booking_id', 'requested_by', 'from_return_at', 'to_return_at', 'extra_days', 'amount', 'status', 'decided_by', 'decided_at', 'note'])]
class BookingExtension extends Model
{
    protected function casts(): array
    {
        return ['from_return_at' => 'datetime', 'to_return_at' => 'datetime', 'decided_at' => 'datetime', 'extra_days' => 'integer', 'amount' => 'integer'];
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
