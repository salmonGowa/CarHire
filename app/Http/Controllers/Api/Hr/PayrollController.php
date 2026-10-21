<?php

namespace App\Http\Controllers\Api\Hr;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\Payslip;
use App\Services\PayrollCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Monthly payroll: draft (regenerate freely) → approved (locked) → paid.
 */
class PayrollController extends Controller
{
    public function __construct(private PayrollCalculator $calculator) {}

    public function index(): JsonResponse
    {
        $runs = PayrollRun::query()->withCount('payslips')
            ->withSum('payslips as gross', 'gross')->withSum('payslips as net', 'net')->withSum('payslips as paye', 'paye')
            ->withSum('payslips as nssf', 'nssf')->withSum('payslips as shif', 'shif')->withSum('payslips as housing_levy', 'housing_levy')
            ->orderByDesc('period')->limit(24)->get();

        return response()->json(['data' => $runs->map(fn (PayrollRun $r) => $this->presentRun($r))]);
    }

    public function show(PayrollRun $run): JsonResponse
    {
        $run->loadCount('payslips')->loadSum('payslips as gross', 'gross')->loadSum('payslips as net', 'net')->loadSum('payslips as paye', 'paye')
            ->loadSum('payslips as nssf', 'nssf')->loadSum('payslips as shif', 'shif')->loadSum('payslips as housing_levy', 'housing_levy');

        return response()->json([
            'data' => [
                ...$this->presentRun($run),
                'payslips' => $run->payslips()->orderBy('employee_name')->get()->map(fn (Payslip $p) => $this->presentSlip($p)),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period' => ['required', 'date_format:Y-m', 'before_or_equal:'.now()->addMonth()->format('Y-m'), Rule::unique('payroll_runs', 'period')],
        ], ['period.unique' => 'A payroll run for that month already exists.']);

        $run = DB::transaction(function () use ($request, $data) {
            $run = PayrollRun::create(['period' => $data['period'], 'status' => 'draft', 'created_by' => $request->user()->id]);
            $this->fill($run);

            return $run;
        });

        return $this->show($run)->setStatusCode(201);
    }

    /** Rebuild a draft from current salaries (e.g. after a raise or a new hire). */
    public function recalculate(PayrollRun $run): JsonResponse
    {
        abort_unless($run->status === 'draft', 422, 'Only draft payroll runs can be recalculated.');
        DB::transaction(fn () => $this->fill($run));

        return $this->show($run);
    }

    public function approve(Request $request, PayrollRun $run): JsonResponse
    {
        abort_unless($run->status === 'draft', 422, 'This run is already approved.');
        abort_if($run->payslips()->doesntExist(), 422, 'There are no payslips in this run.');
        $run->update(['status' => 'approved', 'approved_at' => now(), 'approved_by' => $request->user()->id]);
        AuditLog::record('payroll.approved', "Approved payroll for {$run->period}", $run, 'warning');

        return $this->show($run);
    }

    public function markPaid(PayrollRun $run): JsonResponse
    {
        abort_unless($run->status === 'approved', 422, 'Approve the run before marking it paid.');
        $run->update(['status' => 'paid', 'paid_at' => now()]);
        AuditLog::record('payroll.paid', "Marked payroll for {$run->period} paid", $run);

        return $this->show($run);
    }

    public function destroy(PayrollRun $run): JsonResponse
    {
        abort_unless($run->status === 'draft', 422, 'Approved payroll runs are kept for the record.');
        $run->delete();

        return response()->json(null, 204);
    }

    public function payslip(Payslip $payslip): JsonResponse
    {
        $payslip->load(['run', 'employee']);

        return response()->json(['data' => [
            ...$this->presentSlip($payslip),
            'period' => $payslip->run->period,
            'run_status' => $payslip->run->status,
            'employee' => [
                'number' => $payslip->employee->number(),
                'department' => $payslip->employee->department,
                'kra_pin' => $payslip->employee->kra_pin,
                'nssf_number' => $payslip->employee->nssf_number,
                'shif_number' => $payslip->employee->shif_number,
            ],
        ]]);
    }

    /** Everyone employed at any point in the month gets a payslip at their full monthly salary. */
    private function fill(PayrollRun $run): void
    {
        $start = $run->periodStart();
        $end = $start->copy()->endOfMonth();
        $run->payslips()->delete();

        Employee::query()
            ->where('hired_on', '<=', $end)
            ->where(fn ($q) => $q->whereNull('terminated_on')->orWhere('terminated_on', '>=', $start))
            ->get()
            ->each(fn (Employee $e) => $run->payslips()->create([
                ...$this->calculator->calculate($e->basic_salary),
                'employee_id' => $e->id,
                'employee_name' => $e->name,
                'job_title' => $e->job_title,
            ]));
    }

    /** @return array<string, mixed> */
    private function presentRun(PayrollRun $r): array
    {
        return [
            'id' => $r->id,
            'period' => $r->period,
            'label' => Carbon::createFromFormat('Y-m', $r->period)->format('F Y'),
            'status' => $r->status,
            'employees' => (int) ($r->payslips_count ?? 0),
            'gross' => (int) ($r->gross ?? 0),
            'net' => (int) ($r->net ?? 0),
            'paye' => (int) ($r->paye ?? 0),
            'nssf' => (int) ($r->nssf ?? 0),
            'shif' => (int) ($r->shif ?? 0),
            'housing_levy' => (int) ($r->housing_levy ?? 0),
            'approved_at' => $r->approved_at?->toIso8601String(),
            'paid_at' => $r->paid_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function presentSlip(Payslip $p): array
    {
        return $p->only(['id', 'employee_id', 'employee_name', 'job_title', 'gross', 'nssf', 'shif', 'housing_levy', 'taxable_pay', 'paye', 'net', 'employer_nssf', 'employer_housing_levy']);
    }
}
