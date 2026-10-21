<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['employee_id', 'type', 'start_date', 'end_date', 'days', 'reason', 'status', 'decided_by', 'decided_at'])]
class LeaveRequest extends Model
{
    public const TYPES = ['annual', 'sick', 'maternity', 'paternity', 'compassionate', 'unpaid'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'decided_at' => 'datetime',
            'days' => 'integer',
        ];
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /** Monday to Friday in the range. Public holidays are not excluded. */
    public static function workingDays(CarbonInterface $start, CarbonInterface $end): int
    {
        return collect(CarbonPeriod::create($start, $end))->filter(fn (CarbonInterface $d) => ! $d->isWeekend())->count();
    }
}
