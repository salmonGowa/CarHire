<?php

namespace App\Http\Controllers\Api\Hr;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LeaveController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $requests = LeaveRequest::query()
            ->with('employee')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), fn ($q) => $q->whereHas('employee', fn ($e) => $e->where('name', 'like', '%'.$request->string('search').'%')))
            ->orderByRaw("case when status = 'pending' then 0 else 1 end")
            ->orderByDesc('start_date')
            ->limit(200)
            ->get();

        return response()->json(['data' => $requests->map(fn (LeaveRequest $l) => $this->present($l))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'type' => ['required', Rule::in(LeaveRequest::TYPES)],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);
        $start = Carbon::parse($data['start_date']);
        $end = Carbon::parse($data['end_date']);
        $days = LeaveRequest::workingDays($start, $end);

        if ($days === 0) {
            throw ValidationException::withMessages(['end_date' => 'That range has no working days.']);
        }

        $overlap = LeaveRequest::where('employee_id', $data['employee_id'])->whereIn('status', ['pending', 'approved'])
            ->where('start_date', '<=', $end)->where('end_date', '>=', $start)->exists();
        if ($overlap) {
            throw ValidationException::withMessages(['start_date' => 'This overlaps another leave request for the same person.']);
        }

        $this->assertAnnualBalance(Employee::find($data['employee_id']), $data['type'], $start, $days);

        $leave = LeaveRequest::create([...$data, 'days' => $days, 'status' => 'pending']);

        return response()->json(['data' => $this->present($leave->load('employee'))], 201);
    }

    public function decide(Request $request, LeaveRequest $leave): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['approved', 'rejected'])]]);
        abort_unless($leave->status === 'pending', 422, 'This request has already been decided.');

        if ($data['status'] === 'approved') {
            $this->assertAnnualBalance($leave->employee, $leave->type, $leave->start_date, $leave->days, $leave->id);
        }

        $leave->update([...$data, 'decided_by' => $request->user()->id, 'decided_at' => now()]);
        AuditLog::record("leave.{$data['status']}", ucfirst($data['status'])." {$leave->days}-day {$leave->type} leave for {$leave->employee->name}", $leave);

        return response()->json(['data' => $this->present($leave->load('employee'))]);
    }

    /** Annual leave is capped at the yearly entitlement (approved days in the same calendar year). */
    private function assertAnnualBalance(Employee $employee, string $type, Carbon $start, int $days, ?int $ignoreId = null): void
    {
        if ($type !== 'annual') {
            return;
        }
        $taken = $this->annualTaken($employee, $start->year, $ignoreId);
        $entitlement = (int) config('payroll.annual_leave_days');

        if ($taken + $days > $entitlement) {
            throw ValidationException::withMessages([
                'type' => "{$employee->name} has ".max(0, $entitlement - $taken)." annual leave day(s) left this year; this needs {$days}.",
            ]);
        }
    }

    private function annualTaken(Employee $employee, int $year, ?int $ignoreId = null): int
    {
        return (int) $employee->leaveRequests()->where('type', 'annual')->where('status', 'approved')
            ->whereYear('start_date', $year)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->sum('days');
    }

    /** @return array<string, mixed> */
    private function present(LeaveRequest $l): array
    {
        return [
            'id' => $l->id,
            'reference' => 'LV-'.str_pad((string) $l->id, 3, '0', STR_PAD_LEFT),
            'employee' => ['id' => $l->employee->id, 'name' => $l->employee->name, 'job_title' => $l->employee->job_title],
            'type' => $l->type,
            'start_date' => $l->start_date->toDateString(),
            'end_date' => $l->end_date->toDateString(),
            'days' => $l->days,
            'reason' => $l->reason,
            'status' => $l->status,
            'decided_at' => $l->decided_at?->toIso8601String(),
            'annual_remaining' => $l->type === 'annual'
                ? max(0, (int) config('payroll.annual_leave_days') - $this->annualTaken($l->employee, $l->start_date->year))
                : null,
        ];
    }
}
