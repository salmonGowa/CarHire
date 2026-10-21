<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable(['employee_id', 'date', 'clock_in', 'clock_out', 'notes'])]
class AttendanceRecord extends Model
{
    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /** Late when clocking in after the start time plus the grace period. */
    public function isLate(): bool
    {
        if (! $this->clock_in) {
            return false;
        }
        $cutoff = Carbon::parse(config('payroll.work_starts_at'))->addMinutes((int) config('payroll.late_after_minutes'));

        return Carbon::parse($this->clock_in)->format('H:i:s') > $cutoff->format('H:i:s');
    }
}
