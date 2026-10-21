<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Platform-admin data: dealer contacts, client KYC profiles, internal staff
 * and some audit history.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $contacts = [
            'Premier Auto Group' => ['James Mutuku', '+254 722 111 222', 'jmutuku@premierauto.co.ke', '27834910', 'Grace Wanjiku', '+254 733 222 333', 'gwanjiku@premierauto.co.ke', 'Top-performing dealer. Eligible for the Q1 incentive bonus.'],
            'Swift Car Hire' => ['Patricia Kamau', '+254 711 333 444', 'pkamau@swiftcarhire.co.ke', '19283746', 'David Omondi', '+254 744 555 666', 'domondi@swiftcarhire.co.ke', 'Consistent performer. Contract renewal due in March.'],
            'Rift Valley Motors' => ['Robert Cheruiyot', '+254 700 777 888', 'rcheruiyot@riftmotors.co.ke', '15647382', 'Alice Koech', '+254 755 888 999', 'akoech@riftmotors.co.ke', 'Suspended pending compliance review. Contact legal before reinstating.'],
            'City Movers' => ['Joseph Kariuki', '+254 721 900 101', 'jk@citymovers.co.ke', '22334455', null, null, null, null],
            'Luxe Drive' => ['Wanjiru Mbugua', '+254 712 222 444', 'wanjiru@luxedrive.co.ke', '30112233', 'Kevin Otieno', '+254 799 111 000', 'kevin@luxedrive.co.ke', null],
        ];
        foreach ($contacts as $name => $c) {
            Dealer::where('name', $name)->update([
                'owner_name' => $c[0], 'owner_phone' => $c[1], 'owner_email' => $c[2], 'owner_national_id' => $c[3],
                'manager_name' => $c[4], 'manager_phone' => $c[5], 'manager_email' => $c[6], 'notes' => $c[7],
            ]);
        }

        // Extra dealer staff and internal platform staff.
        $account = fn (string $email, array $attrs) => User::updateOrCreate(['email' => $email], [...$attrs, 'password' => 'password', 'email_verified_at' => now()]);
        $swift = Dealer::where('name', 'Swift Car Hire')->first();
        User::where('email', 'dealer@drivefleet.test')->update(['job_title' => 'Branch Manager']);
        User::where('email', 'premier@drivefleet.test')->update(['job_title' => 'Operations Lead']);
        $account('faith.njeri@swiftcarhire.co.ke', ['name' => 'Faith Njeri', 'role' => UserRole::Dealer, 'dealer_id' => $swift->id, 'company' => $swift->name, 'job_title' => 'Fleet Coordinator', 'last_login_at' => now()->subDays(2)]);
        $account('moses.k@swiftcarhire.co.ke', ['name' => 'Moses Kiprotich', 'role' => UserRole::Dealer, 'dealer_id' => $swift->id, 'company' => $swift->name, 'job_title' => 'Sales Agent', 'disabled_at' => now()->subWeeks(2)]);

        User::where('email', 'superadmin@drivefleet.test')->update(['job_title' => 'System Administrator', 'last_login_at' => now()->subHours(3)]);
        User::where('email', 'hr@drivefleet.test')->update(['job_title' => 'HR Manager', 'last_login_at' => now()->subDay()]);
        $account('grace.o@drivefleet.ke', ['name' => 'Grace Omondi', 'role' => UserRole::SuperAdmin, 'job_title' => 'Support Lead', 'last_login_at' => now()->subDays(1)]);
        $account('peter.n@drivefleet.ke', ['name' => 'Peter Njuguna', 'role' => UserRole::SuperAdmin, 'job_title' => 'Financial Controller', 'last_login_at' => now()->subDays(9)]);
        $account('john.d@drivefleet.ke', ['name' => 'John Doe', 'role' => UserRole::Hr, 'job_title' => 'Onboarding Agent', 'disabled_at' => now()->subMonth()]);

        // Client profiles and KYC states.
        $admin = User::where('email', 'superadmin@drivefleet.test')->first();
        $profiles = [
            'customer@drivefleet.test' => ['national_id' => '27834910', 'kra_pin' => 'A001234567B', 'date_of_birth' => '1988-04-12', 'gender' => 'Male', 'address' => 'Westlands', 'county' => 'Nairobi', 'alt_phone' => '+254 700 111 222', 'kyc_status' => 'verified', 'admin_notes' => 'VIP client. Prefers contact by phone.'],
            'sarah@example.com' => ['national_id' => '31122334', 'date_of_birth' => '1993-09-30', 'gender' => 'Female', 'address' => 'Kilimani', 'county' => 'Nairobi', 'kyc_status' => 'verified'],
            'michael@example.com' => ['national_id' => '29988776', 'date_of_birth' => '1990-01-15', 'gender' => 'Male', 'address' => 'Nyali', 'county' => 'Mombasa', 'kyc_status' => 'pending'],
            'amina@example.com' => ['national_id' => null, 'date_of_birth' => '1997-06-02', 'gender' => 'Female', 'county' => 'Kisumu', 'kyc_status' => 'rejected', 'kyc_note' => 'ID photo unreadable'],
            'david@example.com' => ['national_id' => '25566778', 'date_of_birth' => '1985-11-20', 'gender' => 'Male', 'county' => 'Nakuru', 'kyc_status' => 'verified', 'flagged_at' => now()->subDays(4), 'admin_notes' => 'Two late returns this quarter. Watch for a third.'],
        ];
        foreach ($profiles as $email => $p) {
            User::where('email', $email)->update([...$p, 'kyc_reviewed_at' => $p['kyc_status'] !== 'pending' ? now()->subDays(30) : null, 'kyc_reviewed_by' => $p['kyc_status'] !== 'pending' ? $admin?->id : null]);
        }

        // A little history before today's seeded activity.
        $past = fn (int $hoursAgo, string $actor, string $action, string $description, string $severity, ?string $ip) => AuditLog::create([
            'actor' => $actor, 'action' => $action, 'description' => $description, 'severity' => $severity, 'ip_address' => $ip, 'created_at' => now()->subHours($hoursAgo),
        ]);
        $past(30, 'Unknown', 'auth.failed', 'Failed sign-in for admin@drivefleet.ke (5 attempts)', 'critical', '103.45.22.1');
        $past(52, 'superadmin@drivefleet.test', 'dealer.suspended', 'Dealer Rift Valley Motors marked suspended', 'warning', '41.90.12.33');
        $past(75, 'superadmin@drivefleet.test', 'settings.updated', 'Platform commission rate set to 10%', 'warning', '41.90.12.33');
        $past(100, 'System', 'payout.paid', 'Weekly payout cycle completed', 'info', null);
    }
}
