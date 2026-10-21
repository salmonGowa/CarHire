<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable(['name', 'email', 'phone', 'job_title', 'department', 'employment_type', 'basic_salary', 'hired_on', 'terminated_on', 'kra_pin', 'nssf_number', 'shif_number'])]
class Employee extends Model
{
    protected function casts(): array
    {
        return [
            'hired_on' => 'date',
            'terminated_on' => 'date',
            'basic_salary' => 'integer',
        ];
    }

    public function number(): string
    {
        return 'EMP-'.str_pad((string) $this->id, 3, '0', STR_PAD_LEFT);
    }

    /** @return HasMany<AttendanceRecord, $this> */
    public function attendance(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    /** @return HasMany<LeaveRequest, $this> */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /** @return HasMany<EmployeeDocument, $this> */
    public function documents(): HasMany
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    /**
     * Employed on the given day (hired, and not yet left).
     *
     * @param  Builder<Employee>  $query
     */
    public function scopeEmployedOn(Builder $query, Carbon $day): void
    {
        $query->where('hired_on', '<=', $day)
            ->where(fn ($q) => $q->whereNull('terminated_on')->orWhere('terminated_on', '>=', $day));
    }

    public function isOnLeave(Carbon $day): bool
    {
        return $this->leaveRequests()->where('status', 'approved')
            ->where('start_date', '<=', $day)->where('end_date', '>=', $day)->exists();
    }
}
