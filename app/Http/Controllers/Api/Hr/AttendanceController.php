<?php

namespace App\Http\Controllers\Api\Hr;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    /**
     * The roster for one day: everyone employed, with their clock-in/out,
     * or "on leave" / "not in".
     */
    public function index(Request $request): JsonResponse
    {
        $day = Carbon::parse($request->input('date', today()->toDateString()))->startOfDay();
        $employees = Employee::employedOn($day)->orderBy('name')->get();
        $records = AttendanceRecord::whereDate('date', $day)->get()->keyBy('employee_id');
        $leave = LeaveRequest::where('status', 'approved')->where('start_date', '<=', $day)->where('end_date', '>=', $day)->get()->keyBy('employee_id');

        $rows = $employees->map(function (Employee $e) use ($records, $leave) {
            $r = $records->get($e->id);
            $status = match (true) {
                $leave->has($e->id) => 'on_leave',
                $r?->clock_in === null => 'not_in',
                $r->isLate() => 'late',
                default => 'on_time',
            };

            return [
                'employee_id' => $e->id,
                'number' => $e->number(),
                'name' => $e->name,
                'job_title' => $e->job_title,
                'clock_in' => $r?->clock_in ? substr($r->clock_in, 0, 5) : null,
                'clock_out' => $r?->clock_out ? substr($r->clock_out, 0, 5) : null,
                'status' => $status,
                'leave_type' => $leave->get($e->id)?->type,
                'notes' => $r?->notes,
            ];
        });

        return response()->json([
            'date' => $day->toDateString(),
            'is_weekend' => $day->isWeekend(),
            'data' => $rows->values(),
            'summary' => [
                'headcount' => $rows->count(),
                'present' => $rows->whereIn('status', ['on_time', 'late'])->count(),
                'late' => $rows->where('status', 'late')->count(),
                'on_leave' => $rows->where('status', 'on_leave')->count(),
                'pending_leave' => LeaveRequest::where('status', 'pending')->count(),
            ],
        ]);
    }

    /** Clock an employee in or out (HR records it; employees don't have logins). */
    public function clock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'action' => ['required', Rule::in(['in', 'out'])],
            'date' => ['nullable', 'date', 'before_or_equal:today'],
            'time' => ['nullable', 'date_format:H:i'],
        ]);
        $day = Carbon::parse($data['date'] ?? today())->startOfDay();
        $time = $data['time'] ?? now()->format('H:i');
        $employee = Employee::findOrFail($data['employee_id']);

        if (! Employee::employedOn($day)->whereKey($employee->id)->exists()) {
            throw ValidationException::withMessages(['employee_id' => "{$employee->name} wasn't employed on that day."]);
        }

        $record = AttendanceRecord::firstOrNew(['employee_id' => $employee->id, 'date' => $day->toDateString()]);

        if ($data['action'] === 'in') {
            $record->clock_in = $time.':00';
        } else {
            if (! $record->clock_in) {
                throw ValidationException::withMessages(['action' => "Clock {$employee->name} in first."]);
            }
            if ($time.':00' < $record->clock_in) {
                throw ValidationException::withMessages(['time' => 'Clock-out must be after clock-in.']);
            }
            $record->clock_out = $time.':00';
        }
        $record->save();

        return response()->json(['data' => ['clock_in' => substr((string) $record->clock_in, 0, 5), 'clock_out' => $record->clock_out ? substr($record->clock_out, 0, 5) : null, 'late' => $record->isLate()]]);
    }
}
