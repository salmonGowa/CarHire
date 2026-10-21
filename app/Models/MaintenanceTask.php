<?php

namespace App\Models;

use App\Enums\MaintenanceStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['dealer_id', 'vehicle_id', 'service', 'due_date', 'priority', 'status', 'cost', 'notes', 'started_at', 'completed_at', 'created_by'])]
class MaintenanceTask extends Model
{
    protected function casts(): array
    {
        return [
            'status' => MaintenanceStatus::class,
            'due_date' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cost' => 'integer',
        ];
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class)->withTrashed();
    }
}
