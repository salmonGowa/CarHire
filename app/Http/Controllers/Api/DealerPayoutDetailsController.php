<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dealer;
use App\Models\User;
use App\Services\Notifier;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Where DriveFleet sends the dealership's payouts. Managers change it (with
 * their password); other staff see it masked. Every change is audited and
 * announced to the dealership's managers and to DriveFleet's admins, because a
 * swapped account number is how payout fraud usually happens.
 */
class DealerPayoutDetailsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->dealer, 403);

        return response()->json(['data' => $user->dealer->payoutDetails(masked: ! $user->isDealerManager()), 'can_edit' => $user->isDealerManager()]);
    }

    public function update(Request $request, Notifier $notifier): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isDealerManager(), 403, "Only your dealership's managers can change where payouts go.");
        $method = $request->input('method');
        $mpesaType = $request->input('mpesa_type');

        $data = $request->validate([
            'password' => ['required', 'current_password'],
            'method' => ['required', Rule::in(['bank', 'mpesa'])],
            'account_name' => ['required', 'string', 'max:120'],
            'bank_name' => [Rule::requiredIf($method === 'bank'), 'nullable', 'string', 'max:80'],
            'bank_branch' => ['nullable', 'string', 'max:80'],
            'account_number' => [Rule::requiredIf($method === 'bank'), 'nullable', 'regex:/^[0-9 -]{6,30}$/'],
            'mpesa_type' => [Rule::requiredIf($method === 'mpesa'), 'nullable', Rule::in(['phone', 'paybill', 'till'])],
            'mpesa_number' => [Rule::requiredIf($method === 'mpesa'), 'nullable', 'string', 'max:20'],
            'mpesa_account' => [Rule::requiredIf($method === 'mpesa' && $mpesaType === 'paybill'), 'nullable', 'string', 'max:40'],
        ], [
            'password.current_password' => "That isn't your password.",
            'account_number.regex' => 'Enter the account number using digits only.',
            'account_name.required' => 'Enter the name the account is registered in.',
            'mpesa_account.required' => 'Enter the paybill account number.',
        ]);

        $number = $data['mpesa_number'] ?? null;
        if ($method === 'mpesa') {
            $number = $mpesaType === 'phone' ? PhoneNumber::toE164($number) : (preg_match('/^\d{5,7}$/', (string) $number) ? $number : null);
            if (! $number) {
                throw ValidationException::withMessages(['mpesa_number' => $mpesaType === 'phone' ? 'Enter a Safaricom number, like 0712 345 678.' : 'Paybill and till numbers are 5 to 7 digits.']);
            }
        }

        $dealer = $user->dealer;
        $before = $dealer->payoutDestination(masked: true);
        $dealer->update([
            'payout_method' => $method,
            'payout_account_name' => $data['account_name'],
            'payout_bank_name' => $method === 'bank' ? $data['bank_name'] : null,
            'payout_bank_branch' => $method === 'bank' ? ($data['bank_branch'] ?? null) : null,
            'payout_account_number' => $method === 'bank' ? preg_replace('/[\s-]+/', '', $data['account_number']) : null,
            'payout_mpesa_type' => $method === 'mpesa' ? $mpesaType : null,
            'payout_mpesa_number' => $method === 'mpesa' ? $number : null,
            'payout_mpesa_account' => $method === 'mpesa' && $mpesaType === 'paybill' ? $data['mpesa_account'] : null,
            'payout_details_updated_at' => now(),
            'payout_details_updated_by' => $user->id,
        ]);
        $after = $dealer->payoutDestination(masked: true);

        AuditLog::record('dealer.payout_details_updated', "Payout details for {$dealer->name} changed".($before ? " from {$before}" : '')." to {$after}", $dealer, 'warning', $user);
        $managers = User::where('dealer_id', $dealer->id)->where('dealer_role', 'manager')->whereNull('disabled_at')->get();
        foreach ($managers as $manager) {
            $notifier->user($manager, 'Payout details changed',
                "{$user->name} changed where {$dealer->name}'s payouts go to {$after}. If this wasn't expected, contact DriveFleet straight away.", '/dealer-account', 'warning');
        }
        $notifier->superAdmins('Dealer payout details changed',
            "{$dealer->name}: payouts now go to {$after} (changed by {$user->email}). Payouts are flagged for ".Dealer::PAYOUT_DETAILS_COOLING_HOURS.' hours.', '/superadmin-payouts');

        return response()->json(['data' => $dealer->payoutDetails(), 'can_edit' => true]);
    }
}
