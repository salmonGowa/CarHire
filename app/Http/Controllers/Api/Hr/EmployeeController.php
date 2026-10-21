<?php

namespace App\Http\Controllers\Api\Hr;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public const TYPES = ['full_time', 'part_time', 'contract', 'intern'];

    public function index(Request $request): JsonResponse
    {
        $today = today();
        $onLeave = LeaveRequest::where('status', 'approved')->where('start_date', '<=', $today)->where('end_date', '>=', $today)->pluck('employee_id')->flip();

        $employees = Employee::query()
            ->when($request->input('status', 'current') === 'current', fn ($q) => $q->employedOn($today))
            ->when($request->input('status') === 'left', fn ($q) => $q->whereNotNull('terminated_on')->where('terminated_on', '<', $today))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('job_title', 'like', $term)->orWhere('department', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->orderBy('name')
            ->get();

        $current = Employee::employedOn($today)->count();

        return response()->json([
            'data' => $employees->map(fn (Employee $e) => $this->present($e, $onLeave->has($e->id))),
            'summary' => [
                'headcount' => $current,
                'on_leave' => $onLeave->count(),
                'available' => $current - $onLeave->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $employee = Employee::create($this->validated($request));

        return response()->json(['data' => $this->present($employee, false)], 201);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $employee->update($this->validated($request, $employee));

        return response()->json(['data' => $this->present($employee, $employee->isOnLeave(today()))]);
    }

    /** Record the last working day; history (payslips, attendance) is kept. */
    public function terminate(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate(['terminated_on' => ['required', 'date', 'after_or_equal:'.$employee->hired_on->toDateString()]]);
        $employee->update($data);

        return response()->json(['data' => $this->present($employee, false)]);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Employee $existing = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('employees')->ignore($existing)],
            'phone' => ['nullable', 'string', 'max:30'],
            'job_title' => ['required', 'string', 'max:80'],
            'department' => ['required', 'string', 'max:60'],
            'employment_type' => ['required', Rule::in(self::TYPES)],
            'basic_salary' => ['required', 'integer', 'min:0', 'max:10000000'],
            'hired_on' => ['required', 'date'],
            'kra_pin' => ['nullable', 'string', 'max:20'],
            'nssf_number' => ['nullable', 'string', 'max:30'],
            'shif_number' => ['nullable', 'string', 'max:30'],
        ]);
    }

    /** @return array<string, mixed> */
    public static function present(Employee $e, bool $onLeave): array
    {
        $left = $e->terminated_on !== null && $e->terminated_on->lt(today());

        return [
            'id' => $e->id,
            'number' => $e->number(),
            'name' => $e->name,
            'email' => $e->email,
            'phone' => $e->phone,
            'job_title' => $e->job_title,
            'department' => $e->department,
            'employment_type' => $e->employment_type,
            'basic_salary' => $e->basic_salary,
            'hired_on' => $e->hired_on->toDateString(),
            'terminated_on' => $e->terminated_on?->toDateString(),
            'kra_pin' => $e->kra_pin,
            'nssf_number' => $e->nssf_number,
            'shif_number' => $e->shif_number,
            'status' => $left ? 'left' : ($onLeave ? 'on_leave' : 'active'),
        ];
    }
}
