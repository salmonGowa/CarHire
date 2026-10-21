<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['employee_id', 'type', 'path', 'original_name', 'mime_type', 'size', 'expires_on', 'status', 'uploaded_by', 'reviewed_by', 'reviewed_at'])]
class EmployeeDocument extends Model
{
    public const TYPES = ['National ID / Passport', 'KRA PIN Certificate', 'SHA / SHIF Card', 'NSSF Card', 'Driving Licence', 'Employment Contract', 'Academic Certificate', 'Other'];

    protected function casts(): array
    {
        return ['expires_on' => 'date', 'reviewed_at' => 'datetime', 'size' => 'integer'];
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function isExpiringSoon(): bool
    {
        return $this->expires_on !== null && $this->expires_on->lte(today()->addDays(60));
    }
}
