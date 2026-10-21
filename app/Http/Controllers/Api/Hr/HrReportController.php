<?php

namespace App\Http\Controllers\Api\Hr;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\Payslip;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CSV downloads built on demand from live data.
 */
class HrReportController extends Controller
{
    public const REPORTS = ['payroll', 'statutory', 'attendance', 'headcount'];

    public function __invoke(Request $request, string $report): StreamedResponse
    {
        abort_unless(in_array($report, self::REPORTS, true), 404);
        $period = $request->input('period', now()->format('Y-m'));
        abort_unless(preg_match('/^\d{4}-\d{2}$/', $period), 422, 'Use a YYYY-MM period.');

        [$header, $rows] = match ($report) {
            'payroll', 'statutory' => $this->payroll($report, $period),
            'attendance' => $this->attendance($period),
            'headcount' => $this->headcount(),
        };

        return response()->streamDownload(function () use ($header, $rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $header);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, "{$report}-{$period}.csv", ['Content-Type' => 'text/csv']);
    }

    /** @return array{0: list<string>, 1: iterable<list<mixed>>} */
    private function payroll(string $report, string $period): array
    {
        $run = PayrollRun::where('period', $period)->first();
        abort_unless($run, 404, "No payroll run for {$period}.");
        $slips = $run->payslips()->with('employee')->orderBy('employee_name')->get();

        if ($report === 'payroll') {
            return [
                ['Employee No', 'Name', 'Job Title', 'Gross', 'NSSF', 'SHIF', 'Housing Levy', 'Taxable Pay', 'PAYE', 'Net Pay'],
                $slips->map(fn (Payslip $p) => [$p->employee->number(), $p->employee_name, $p->job_title, $p->gross, $p->nssf, $p->shif, $p->housing_levy, $p->taxable_pay, $p->paye, $p->net]),
            ];
        }

        return [
            ['Employee No', 'Name', 'KRA PIN', 'NSSF No', 'SHIF No', 'PAYE', 'NSSF (employee)', 'NSSF (employer)', 'SHIF', 'Housing Levy (employee)', 'Housing Levy (employer)'],
            $slips->map(fn (Payslip $p) => [$p->employee->number(), $p->employee_name, $p->employee->kra_pin, $p->employee->nssf_number, $p->employee->shif_number, $p->paye, $p->nssf, $p->employer_nssf, $p->shif, $p->housing_levy, $p->employer_housing_levy]),
        ];
    }

    /** @return array{0: list<string>, 1: iterable<list<mixed>>} */
    private function attendance(string $period): array
    {
        $start = Carbon::createFromFormat('Y-m-d', $period.'-01')->startOfDay();
        $records = AttendanceRecord::with('employee')->whereBetween('date', [$start, $start->copy()->endOfMonth()])->orderBy('date')->get();

        return [
            ['Date', 'Employee No', 'Name', 'Clock In', 'Clock Out', 'Late'],
            $records->map(fn (AttendanceRecord $r) => [$r->date->toDateString(), $r->employee->number(), $r->employee->name, $r->clock_in, $r->clock_out, $r->isLate() ? 'yes' : 'no']),
        ];
    }

    /** @return array{0: list<string>, 1: iterable<list<mixed>>} */
    private function headcount(): array
    {
        return [
            ['Employee No', 'Name', 'Email', 'Department', 'Job Title', 'Type', 'Hired', 'Left', 'Basic Salary'],
            Employee::orderBy('name')->get()->map(fn (Employee $e) => [$e->number(), $e->name, $e->email, $e->department, $e->job_title, $e->employment_type, $e->hired_on->toDateString(), $e->terminated_on?->toDateString(), $e->basic_salary]),
        ];
    }
}
