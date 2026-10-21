<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed one demo account per role. All use the password "password".
     */
    public function run(): void
    {
        $accounts = [
            ['name' => 'Super Admin', 'email' => 'superadmin@drivefleet.test', 'role' => UserRole::SuperAdmin],
            ['name' => 'HR Manager', 'email' => 'hr@drivefleet.test', 'role' => UserRole::Hr],
            ['name' => 'Swift Car Hire', 'email' => 'dealer@drivefleet.test', 'role' => UserRole::Dealer, 'company' => 'Swift Car Hire'],
            ['name' => 'James Mwangi', 'email' => 'customer@drivefleet.test', 'role' => UserRole::Customer],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                $account + ['password' => 'password', 'email_verified_at' => now()],
            );
        }

        AuditLog::query()->delete();
        $this->call([FleetSeeder::class, HrSeeder::class, AdminSeeder::class]);
    }
}
