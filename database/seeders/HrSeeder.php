<?php

namespace Database\Seeders;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\LeaveRequest;
use App\Models\PayrollRun;
use App\Models\User;
use App\Services\PayrollCalculator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * DriveFleet's own staff, with attendance, leave, payroll history and
 * documents, dated relative to today.
 */
class HrSeeder extends Seeder
{
    use MakesPlaceholderPdf;

    public function run(): void
    {
        Storage::disk('local')->deleteDirectory('employee-documents');
        EmployeeDocument::query()->delete();
        PayrollRun::query()->delete();
        LeaveRequest::query()->delete();
        AttendanceRecord::query()->delete();
        Employee::query()->delete();

        $hr = User::where('email', 'hr@drivefleet.test')->first();
        $today = today();

        // [name, title, department, type, salary, hired days ago, left days ago]
        $staff = [
            ['Amina Hassan', 'Fleet Manager', 'Operations', 'full_time', 120000, 700],
            ['David Kipkorir', 'Lead Mechanic', 'Fleet Maintenance', 'full_time', 85000, 650],
            ['Sarah Wanjiku', 'Accountant', 'Finance', 'full_time', 95000, 600],
            ['James Otieno', 'Chauffeur', 'Operations', 'contract', 45000, 420],
            ['Brian Kamau', 'Chauffeur', 'Operations', 'contract', 45000, 380],
            ['Grace Njoroge', 'Customer Support Lead', 'Customer Support', 'full_time', 70000, 500],
            ['John Mwangi', 'Mechanic', 'Fleet Maintenance', 'full_time', 55000, 300],
            ['Mercy Achieng', 'Sales Executive', 'Sales', 'full_time', 60000, 260],
            ['Peter Odhiambo', 'Sales Executive', 'Sales', 'full_time', 58000, 210],
            ['Lucy Wambui', 'HR Officer', 'Human Resources', 'full_time', 75000, 540],
            ['Kevin Mutua', 'Support Agent', 'Customer Support', 'part_time', 32000, 150],
            ['Faith Chebet', 'Finance Intern', 'Finance', 'intern', 15000, 40],
            ['Samuel Kiprono', 'Car Valet', 'Fleet Maintenance', 'contract', 28000, 90],
            ['Esther Nyambura', 'Operations Coordinator', 'Operations', 'full_time', 65000, 12],
            ['Daniel Owino', 'Chauffeur', 'Operations', 'contract', 45000, 480, 70],
        ];

        $employees = collect($staff)->map(fn (array $s) => Employee::create([
            'name' => $s[0], 'job_title' => $s[1], 'department' => $s[2], 'employment_type' => $s[3], 'basic_salary' => $s[4],
            'email' => strtolower(str_replace(' ', '.', $s[0])).'@drivefleet.ke',
            'phone' => '+254 7'.str_pad((string) (crc32($s[0]) % 100000000), 8, '0', STR_PAD_LEFT),
            'hired_on' => $today->copy()->subDays($s[5]),
            'terminated_on' => isset($s[6]) ? $today->copy()->subDays($s[6]) : null,
            'kra_pin' => 'A00'.str_pad((string) (crc32($s[0].'kra') % 10000000), 7, '0', STR_PAD_LEFT).'Z',
            'nssf_number' => (string) (2000000000 + crc32($s[0]) % 99999999),
            'shif_number' => 'SHA'.str_pad((string) (crc32($s[0].'sha') % 100000000), 8, '0', STR_PAD_LEFT),
        ]))->keyBy('name');

        // Leave: Sarah is away now; others pending, approved earlier, rejected.
        $leave = fn (string $who, string $type, int $from, int $to, string $status, ?string $reason = null) => LeaveRequest::create([
            'employee_id' => $employees[$who]->id, 'type' => $type, 'reason' => $reason, 'status' => $status,
            'start_date' => $today->copy()->addDays($from), 'end_date' => $today->copy()->addDays($to),
            'days' => LeaveRequest::workingDays($today->copy()->addDays($from), $today->copy()->addDays($to)),
            'decided_by' => $status === 'pending' ? null : $hr?->id, 'decided_at' => $status === 'pending' ? null : now()->subDays(3),
        ]);
        $leave('Sarah Wanjiku', 'annual', -2, 6, 'approved', 'Family visit');
        $leave('Brian Kamau', 'sick', -20, -19, 'approved', 'Flu');
        $leave('James Otieno', 'annual', 7, 16, 'pending', 'Upcountry wedding');
        $leave('Mercy Achieng', 'compassionate', 3, 4, 'pending', 'Funeral');
        $leave('John Mwangi', 'annual', -40, -36, 'approved');
        $leave('Peter Odhiambo', 'annual', 2, 5, 'rejected', 'Clashes with sales week');

        // Attendance for the last two working weeks (today partly in).
        foreach (range(13, 0) as $ago) {
            $day = $today->copy()->subDays($ago);
            if ($day->isWeekend()) {
                continue;
            }
            foreach (Employee::employedOn($day)->get() as $e) {
                if ($e->isOnLeave($day) || crc32($e->name.$ago) % 17 === 0) {
                    continue; // on leave, or absent
                }
                $late = crc32($e->name.'late'.$ago) % 6 === 0;
                $in = Carbon::parse('07:40')->addMinutes($late ? 35 + crc32($e->name) % 40 : crc32($e->name.$ago) % 30);
                AttendanceRecord::create([
                    'employee_id' => $e->id, 'date' => $day->toDateString(), 'clock_in' => $in->format('H:i:s'),
                    'clock_out' => $ago === 0 ? null : $in->copy()->addHours(9)->addMinutes(crc32($e->name) % 50)->format('H:i:s'),
                ]);
            }
        }

        // Payroll: two months paid, last month approved, this month in draft.
        $calc = app(PayrollCalculator::class);
        foreach ([3 => 'paid', 2 => 'paid', 1 => 'approved', 0 => 'draft'] as $ago => $status) {
            $start = $today->copy()->startOfMonth()->subMonthsNoOverflow($ago);
            $run = PayrollRun::create([
                'period' => $start->format('Y-m'), 'status' => $status, 'created_by' => $hr?->id,
                'approved_at' => $status !== 'draft' ? $start->copy()->endOfMonth()->subDays(3) : null,
                'approved_by' => $status !== 'draft' ? $hr?->id : null,
                'paid_at' => $status === 'paid' ? $start->copy()->endOfMonth()->subDay() : null,
            ]);
            Employee::where('hired_on', '<=', $start->copy()->endOfMonth())
                ->where(fn ($q) => $q->whereNull('terminated_on')->orWhere('terminated_on', '>=', $start))
                ->get()
                ->each(fn (Employee $e) => $run->payslips()->create([...$calc->calculate($e->basic_salary), 'employee_id' => $e->id, 'employee_name' => $e->name, 'job_title' => $e->job_title]));
        }

        // Documents: small placeholder PDFs on the private disk.
        $doc = function (string $who, string $type, string $status, ?int $expiresIn = null) use ($employees, $hr) {
            $e = $employees[$who];
            $name = str_replace([' ', '/'], ['-', ''], strtolower($type)).'.pdf';
            $path = "employee-documents/{$e->id}/".uniqid().'.pdf';
            Storage::disk('local')->put($path, $this->placeholderPdf("{$type} - {$e->name}"));
            EmployeeDocument::create([
                'employee_id' => $e->id, 'type' => $type, 'path' => $path, 'original_name' => $name, 'mime_type' => 'application/pdf',
                'size' => Storage::disk('local')->size($path), 'status' => $status, 'uploaded_by' => $hr?->id,
                'expires_on' => $expiresIn !== null ? today()->addDays($expiresIn) : null,
                'reviewed_by' => $status === 'pending' ? null : $hr?->id, 'reviewed_at' => $status === 'pending' ? null : now()->subDays(5),
            ]);
        };
        $doc('Amina Hassan', 'KRA PIN Certificate', 'verified');
        $doc('Amina Hassan', 'Employment Contract', 'verified', 400);
        $doc('David Kipkorir', 'SHA / SHIF Card', 'verified');
        $doc('James Otieno', 'Driving Licence', 'pending', 25);
        $doc('Brian Kamau', 'Driving Licence', 'verified', 300);
        $doc('Esther Nyambura', 'National ID / Passport', 'pending');
        $doc('Kevin Mutua', 'Employment Contract', 'verified', 45);
    }
}
