<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * DriveFleet's internal accounts: super admins and HR managers.
 */
class StaffAdminController extends Controller
{
    use CreatesAccounts;

    public function index(): JsonResponse
    {
        $staff = User::whereIn('role', [UserRole::SuperAdmin, UserRole::Hr])->orderBy('role')->orderBy('name')->get();

        return response()->json([
            'data' => $staff->map(fn (User $u) => DealerAdminController::presentStaff($u)),
            'summary' => [
                'active' => $staff->whereNull('disabled_at')->count(),
                'super_admins' => $staff->where('role', UserRole::SuperAdmin)->whereNull('disabled_at')->count(),
                'signed_in_7_days' => $staff->filter(fn (User $u) => $u->last_login_at?->gte(now()->subDays(7)))->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in([UserRole::SuperAdmin->value, UserRole::Hr->value])],
            'job_title' => ['required', 'string', 'max:80'],
        ]);
        [$user, $password] = $this->createAccount(UserRole::from($data['role']), collect($data)->except('role')->all());
        AuditLog::record('staff.invited', "Created {$data['role']} account for {$user->email}", $user, $data['role'] === 'superadmin' ? 'warning' : 'info');

        return response()->json(['data' => DealerAdminController::presentStaff($user), 'temporary_password' => $password], 201);
    }
}
