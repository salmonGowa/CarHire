<?php

namespace App\Http\Controllers\Api\Hr;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\LeaveRequest;
use App\Models\PayrollRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * Numbers for the HR dashboard and analytics pages.
 */
class HrSummaryController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $today = today();
        $headcount = Employee::employedOn($today)->count();
        $onLeave = LeaveRequest::where('status', 'approved')->where('start_date', '<=', $today)->where('end_date', '>=', $today)->count();

        $headcountTrend = collect(range(5, 0))->map(function (int $ago) {
            $end = now()->subMonthsNoOverflow($ago)->endOfMonth()->min(now());

            return ['month' => $end->format('Y-m'), 'label' => $end->format('M'), 'count' => Employee::employedOn($end)->count()];
        });

        $yearStart = $today->copy()->startOfYear();
        $leaversYtd = Employee::whereBetween('terminated_on', [$yearStart, $today])->count();
        $avgHeadcount = max(1, ($headcount + Employee::employedOn($yearStart)->count()) / 2);

        $runs = PayrollRun::query()->withSum('payslips as gross', 'gross')->withSum('payslips as net', 'net')
            ->orderByDesc('period')->limit(6)->get()->reverse()->values();
        $latest = PayrollRun::query()->withCount('payslips')->withSum('payslips as gross', 'gross')->withSum('payslips as net', 'net')
            ->withSum('payslips as paye', 'paye')->withSum('payslips as nssf', 'nssf')->withSum('payslips as shif', 'shif')
            ->withSum('payslips as housing_levy', 'housing_levy')->orderByDesc('period')->first();

        return response()->json([
            'headcount' => $headcount,
            'present_today' => AttendanceRecord::whereDate('date', $today)->whereNotNull('clock_in')->count(),
            'on_leave_today' => $onLeave,
            'pending_leave' => LeaveRequest::where('status', 'pending')->count(),
            'new_this_month' => Employee::where('hired_on', '>=', $today->copy()->startOfMonth())->count(),
            'attrition_ytd_percent' => round($leaversYtd / $avgHeadcount * 100, 1),
            'documents' => [
                'pending' => EmployeeDocument::where('status', 'pending')->count(),
                'expiring' => EmployeeDocument::whereNotNull('expires_on')->where('expires_on', '<=', $today->copy()->addDays(60))->count(),
            ],
            'headcount_trend' => $headcountTrend,
            'departments' => Employee::employedOn($today)->selectRaw('department, count(*) as total')->groupBy('department')->orderByDesc('total')->get()
                ->map(fn ($r) => ['department' => $r->department, 'count' => (int) $r->total, 'percent' => $headcount ? (int) round($r->total / $headcount * 100) : 0]),
            'payroll_history' => $runs->map(fn (PayrollRun $r) => ['period' => $r->period, 'label' => Carbon::createFromFormat('Y-m', $r->period)->format('M'), 'gross' => (int) $r->gross, 'net' => (int) $r->net, 'status' => $r->status]),
            'latest_payroll' => $latest ? [
                'id' => $latest->id,
                'period' => $latest->period,
                'label' => Carbon::createFromFormat('Y-m', $latest->period)->format('F Y'),
                'status' => $latest->status,
                'employees' => (int) $latest->payslips_count,
                'gross' => (int) $latest->gross,
                'net' => (int) $latest->net,
                'paye' => (int) $latest->paye,
                'nssf' => (int) $latest->nssf,
                'shif' => (int) $latest->shif,
                'housing_levy' => (int) $latest->housing_levy,
            ] : null,
        ]);
    }
}
