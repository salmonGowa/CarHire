<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\PayrollCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HrApiTest extends TestCase
{
    use RefreshDatabase;

    private User $hr;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hr = User::factory()->create(['role' => UserRole::Hr]);
    }

    private function employee(array $attrs = []): Employee
    {
        static $n = 0;
        $n++;

        return Employee::create([
            'name' => "Employee {$n}", 'email' => "e{$n}@drivefleet.ke", 'job_title' => 'Driver', 'department' => 'Operations',
            'employment_type' => 'full_time', 'basic_salary' => 45000, 'hired_on' => now()->subYear()->toDateString(), ...$attrs,
        ]);
    }

    public function test_payroll_calculator_applies_kenyan_deductions(): void
    {
        $slip = app(PayrollCalculator::class)->calculate(45000);

        $this->assertSame(2700, $slip['nssf']);          // 6%
        $this->assertSame(1238, $slip['shif']);          // 2.75%
        $this->assertSame(675, $slip['housing_levy']);   // 1.5%
        $this->assertSame(40387, $slip['taxable_pay']);  // after allowable deductions
        $this->assertSame(4499, $slip['paye']);          // bands less KSh 2,400 relief
        $this->assertSame(35888, $slip['net']);

        $high = app(PayrollCalculator::class)->calculate(300000);
        $this->assertSame(4320, $high['nssf'], 'NSSF caps at the upper earnings limit');

        $low = app(PayrollCalculator::class)->calculate(8000);
        $this->assertSame(300, $low['shif'], 'SHIF has a KSh 300 minimum');
        $this->assertSame(0, $low['paye']);
    }

    public function test_only_hr_and_super_admins_can_use_hr(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Dealer]))->getJson('/api/hr/employees')->assertForbidden();
        $this->actingAs(User::factory()->create())->getJson('/api/hr/summary')->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => UserRole::SuperAdmin]))->getJson('/api/hr/employees')->assertOk();
        $this->actingAs($this->hr)->getJson('/api/hr/employees')->assertOk();
    }

    public function test_onboard_and_terminate_employee(): void
    {
        $id = $this->actingAs($this->hr)->postJson('/api/hr/employees', [
            'name' => 'Jane Doe', 'email' => 'jane@drivefleet.ke', 'job_title' => 'Driver', 'department' => 'Operations',
            'employment_type' => 'contract', 'basic_salary' => 40000, 'hired_on' => now()->subMonth()->toDateString(),
        ])->assertCreated()->assertJsonPath('data.number', fn ($n) => str_starts_with($n, 'EMP-'))->json('data.id');

        $this->actingAs($this->hr)->postJson('/api/hr/employees', ['name' => 'X', 'email' => 'jane@drivefleet.ke'])->assertJsonValidationErrors('email');

        $this->actingAs($this->hr)->postJson("/api/hr/employees/{$id}/terminate", ['terminated_on' => now()->subDay()->toDateString()])->assertOk()->assertJsonPath('data.status', 'left');
        $this->actingAs($this->hr)->getJson('/api/hr/employees')->assertJsonCount(0, 'data');
        $this->actingAs($this->hr)->getJson('/api/hr/employees?status=left')->assertJsonCount(1, 'data');
    }

    public function test_leave_counts_working_days_and_enforces_rules(): void
    {
        $e = $this->employee();
        $monday = Carbon::parse('next monday');

        // Mon to the following Mon = 6 working days.
        $id = $this->actingAs($this->hr)->postJson('/api/hr/leave', [
            'employee_id' => $e->id, 'type' => 'annual', 'start_date' => $monday->toDateString(), 'end_date' => $monday->copy()->addWeek()->toDateString(),
        ])->assertCreated()->assertJsonPath('data.days', 6)->json('data.id');

        $this->actingAs($this->hr)->postJson('/api/hr/leave', [
            'employee_id' => $e->id, 'type' => 'sick', 'start_date' => $monday->copy()->addDays(2)->toDateString(), 'end_date' => $monday->copy()->addDays(3)->toDateString(),
        ])->assertJsonValidationErrors('start_date');

        $this->actingAs($this->hr)->postJson('/api/hr/leave', [
            'employee_id' => $e->id, 'type' => 'annual', 'start_date' => $monday->copy()->addDays(5)->toDateString(), 'end_date' => $monday->copy()->addDays(6)->toDateString(),
        ])->assertJsonValidationErrors('end_date'); // Sat-Sun: no working days

        $this->actingAs($this->hr)->patchJson("/api/hr/leave/{$id}", ['status' => 'approved'])->assertOk()->assertJsonPath('data.annual_remaining', 15);
        $this->actingAs($this->hr)->patchJson("/api/hr/leave/{$id}", ['status' => 'rejected'])->assertUnprocessable();
    }

    public function test_annual_leave_cannot_exceed_entitlement(): void
    {
        $e = $this->employee();
        $start = Carbon::parse('first monday of january next year');
        LeaveRequest::create(['employee_id' => $e->id, 'type' => 'annual', 'start_date' => $start, 'end_date' => $start->copy()->addDays(25), 'days' => 18, 'status' => 'approved']);

        $this->actingAs($this->hr)->postJson('/api/hr/leave', [
            'employee_id' => $e->id, 'type' => 'annual', 'start_date' => $start->copy()->addMonths(3)->toDateString(), 'end_date' => $start->copy()->addMonths(3)->addDays(7)->toDateString(),
        ])->assertJsonValidationErrors('type');
    }

    public function test_attendance_clock_in_out_and_lateness(): void
    {
        $e = $this->employee();
        $this->actingAs($this->hr)->postJson('/api/hr/attendance/clock', ['employee_id' => $e->id, 'action' => 'out', 'time' => '17:00'])->assertJsonValidationErrors('action');
        $this->actingAs($this->hr)->postJson('/api/hr/attendance/clock', ['employee_id' => $e->id, 'action' => 'in', 'time' => '08:30'])->assertOk()->assertJsonPath('data.late', true);
        $this->actingAs($this->hr)->postJson('/api/hr/attendance/clock', ['employee_id' => $e->id, 'action' => 'out', 'time' => '08:00'])->assertJsonValidationErrors('time');
        $this->actingAs($this->hr)->postJson('/api/hr/attendance/clock', ['employee_id' => $e->id, 'action' => 'out', 'time' => '17:30'])->assertOk();

        $this->actingAs($this->hr)->getJson('/api/hr/attendance')
            ->assertJsonPath('summary.present', 1)->assertJsonPath('summary.late', 1)->assertJsonPath('data.0.clock_out', '17:30');
    }

    public function test_payroll_run_lifecycle(): void
    {
        $this->employee(['basic_salary' => 45000]);
        $this->employee(['basic_salary' => 85000]);
        $this->employee(['hired_on' => now()->addMonths(2)->toDateString()]); // not yet employed
        $period = now()->format('Y-m');

        $run = $this->actingAs($this->hr)->postJson('/api/hr/payroll-runs', ['period' => $period])
            ->assertCreated()->assertJsonPath('data.employees', 2)->assertJsonPath('data.gross', 130000)->assertJsonPath('data.status', 'draft')->json('data');
        $this->actingAs($this->hr)->postJson('/api/hr/payroll-runs', ['period' => $period])->assertJsonValidationErrors('period');

        Employee::where('basic_salary', 45000)->update(['basic_salary' => 50000]);
        $this->actingAs($this->hr)->postJson("/api/hr/payroll-runs/{$run['id']}/recalculate")->assertJsonPath('data.gross', 135000);

        $this->actingAs($this->hr)->postJson("/api/hr/payroll-runs/{$run['id']}/mark-paid")->assertUnprocessable();
        $this->actingAs($this->hr)->postJson("/api/hr/payroll-runs/{$run['id']}/approve")->assertJsonPath('data.status', 'approved');
        $this->actingAs($this->hr)->postJson("/api/hr/payroll-runs/{$run['id']}/recalculate")->assertUnprocessable();
        $this->actingAs($this->hr)->deleteJson("/api/hr/payroll-runs/{$run['id']}")->assertUnprocessable();
        $this->actingAs($this->hr)->postJson("/api/hr/payroll-runs/{$run['id']}/mark-paid")->assertJsonPath('data.status', 'paid');

        $slipId = $this->actingAs($this->hr)->getJson("/api/hr/payroll-runs/{$run['id']}")->json('data.payslips.0.id');
        $this->actingAs($this->hr)->getJson("/api/hr/payslips/{$slipId}")->assertOk()->assertJsonPath('data.period', $period);
    }

    public function test_documents_are_stored_privately_and_downloadable_by_hr_only(): void
    {
        Storage::fake('local');
        $e = $this->employee();

        $doc = $this->actingAs($this->hr)->post('/api/hr/documents', [
            'employee_id' => $e->id, 'type' => 'Driving Licence', 'file' => UploadedFile::fake()->create('licence.pdf', 200, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.status', 'pending')->json('data');

        $this->actingAs($this->hr)->post('/api/hr/documents', [
            'employee_id' => $e->id, 'type' => 'Driving Licence', 'file' => UploadedFile::fake()->create('virus.exe', 10),
        ], ['Accept' => 'application/json'])->assertJsonValidationErrors('file');

        $this->actingAs($this->hr)->get("/api/hr/documents/{$doc['id']}/download")->assertOk()->assertDownload('licence.pdf');
        $this->actingAs(User::factory()->create(['role' => UserRole::Dealer]))->getJson("/api/hr/documents/{$doc['id']}/download")->assertForbidden();

        $this->actingAs($this->hr)->patchJson("/api/hr/documents/{$doc['id']}", ['status' => 'verified'])->assertJsonPath('data.status', 'verified');
    }

    public function test_reports_download_csv(): void
    {
        $this->employee(['name' => 'Csv Person']);
        $this->actingAs($this->hr)->postJson('/api/hr/payroll-runs', ['period' => now()->format('Y-m')]);

        $csv = $this->actingAs($this->hr)->get('/api/hr/reports/payroll?period='.now()->format('Y-m'))->assertOk()->streamedContent();
        $this->assertStringContainsString('Csv Person', $csv);
        $this->assertStringContainsString('PAYE', $csv);

        $this->actingAs($this->hr)->get('/api/hr/reports/statutory?period=1999-01')->assertNotFound();
        $this->actingAs($this->hr)->get('/api/hr/reports/nope')->assertNotFound();
    }
}
