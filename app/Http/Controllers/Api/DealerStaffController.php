<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Api\Admin\CreatesAccounts;
use App\Http\Controllers\Api\Admin\DealerAdminController;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * A dealership's own staff logins. Everyone at the dealer can see the list;
 * managers add people, change roles, suspend and reset passwords.
 */
class DealerStaffController extends Controller
{
    use CreatesAccounts;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $dealer = $this->dealer($user);
        $dealer->load('plan');

        return response()->json([
            'data' => $dealer->staff()->orderByRaw("case when dealer_role = 'manager' then 0 else 1 end")->orderBy('name')->get()
                ->map(fn (User $u) => [...DealerAdminController::presentStaff($u), 'is_me' => $u->id === $user->id]),
            'can_manage' => $user->isDealerManager(),
            'limit' => $dealer->plan?->staff_limit,
            'plan' => $dealer->plan?->name,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $dealer = $this->managerDealer($request->user());
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'job_title' => ['required', 'string', 'max:80'],
            'dealer_role' => ['required', Rule::in(['manager', 'staff'])],
        ]);
        if ($reason = $dealer->staffLimitReached()) {
            abort(422, $reason);
        }
        [$user, $password] = $this->createAccount(UserRole::Dealer, [...$data, 'dealer_id' => $dealer->id, 'company' => $dealer->name]);
        AuditLog::record('dealer.staff_added', "Added {$user->email} to {$dealer->name}", $dealer);

        return response()->json(['data' => DealerAdminController::presentStaff($user), 'temporary_password' => $password], 201);
    }

    public function update(Request $request, User $staff): JsonResponse
    {
        $me = $request->user();
        $dealer = $this->managerDealer($me);
        abort_unless($staff->dealer_id === $dealer->id, 404);
        $data = $request->validate([
            'job_title' => ['sometimes', 'string', 'max:80'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'dealer_role' => ['sometimes', Rule::in(['manager', 'staff'])],
            'suspended' => ['sometimes', 'boolean'],
        ]);

        $demoting = isset($data['dealer_role']) && $data['dealer_role'] === 'staff' && $staff->dealer_role === 'manager';
        $suspending = ($data['suspended'] ?? false) && ! $staff->isDisabled();
        if ($staff->is($me) && ($demoting || $suspending)) {
            abort(422, "You can't remove your own manager access or suspend yourself.");
        }
        if (($demoting || ($suspending && $staff->dealer_role === 'manager'))
            && $dealer->staff()->where('dealer_role', 'manager')->whereNull('disabled_at')->count() <= 1) {
            abort(422, 'Your dealership needs at least one active manager.');
        }

        if (array_key_exists('suspended', $data)) {
            $staff->disabled_at = $data['suspended'] ? now() : null;
            AuditLog::record($data['suspended'] ? 'account.suspended' : 'account.reinstated',
                ($data['suspended'] ? 'Suspended ' : 'Reinstated ')."{$staff->email} at {$dealer->name}", $staff, $data['suspended'] ? 'warning' : 'info');
            unset($data['suspended']);
        }
        $staff->fill($data)->save();

        return response()->json(['data' => [...DealerAdminController::presentStaff($staff), 'is_me' => $staff->is($me)]]);
    }

    /** Issue a new temporary password for a colleague who is locked out. */
    public function resetPassword(Request $request, User $staff): JsonResponse
    {
        $dealer = $this->managerDealer($request->user());
        abort_unless($staff->dealer_id === $dealer->id, 404);
        abort_if($staff->is($request->user()), 422, 'Change your own password under your profile instead.');

        $password = Str::password(12, symbols: false);
        $staff->update(['password' => $password]);
        AuditLog::record('dealer.staff_password_reset', "Reset the password for {$staff->email}", $staff, 'warning');

        return response()->json(['temporary_password' => $password]);
    }

    private function dealer(User $user): Dealer
    {
        abort_unless($user->isDealer() && $user->dealer, 403);

        return $user->dealer;
    }

    private function managerDealer(User $user): Dealer
    {
        abort_unless($user->isDealerManager(), 403, 'Only your dealership\'s managers can change staff accounts.');

        return $user->dealer;
    }
}
