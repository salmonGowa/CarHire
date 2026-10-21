<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Suspend or reinstate any account. Suspended users are signed out on their
 * next request and can't sign in.
 */
class AccountStatusController extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['suspended' => ['required', 'boolean']]);
        $actor = $request->user();

        if ($data['suspended']) {
            abort_if($user->is($actor), 422, "You can't suspend your own account.");
            abort_if($user->isSuperAdmin() && User::where('role', UserRole::SuperAdmin)->whereNull('disabled_at')->count() <= 1, 422,
                "That's the last active super admin.");
        }

        $user->update(['disabled_at' => $data['suspended'] ? now() : null]);
        AuditLog::record($data['suspended'] ? 'account.suspended' : 'account.reinstated',
            ($data['suspended'] ? 'Suspended ' : 'Reinstated ').$user->email, $user, $data['suspended'] ? 'warning' : 'info');

        return response()->json(['data' => ['id' => $user->id, 'status' => $user->isDisabled() ? 'suspended' : 'active']]);
    }
}
