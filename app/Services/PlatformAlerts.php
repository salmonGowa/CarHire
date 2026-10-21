<?php

namespace App\Services;

use App\Enums\PayoutStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\DealerDocument;
use App\Models\Payout;
use App\Models\SubscriptionCharge;
use App\Models\SupportTicket;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Support\Facades\Cache;

/**
 * Things a super admin should look at, worked out from live data. Shown on
 * the dashboard and in Reports.
 */
class PlatformAlerts
{
    public const SCHEDULER_HEARTBEAT = 'scheduler:heartbeat';

    /** @return list<array{type: string, msg: string, link: string|null}> */
    public function current(): array
    {
        $alerts = [];
        $add = function (bool $when, string $type, string $msg, ?string $link = null) use (&$alerts) {
            if ($when) {
                $alerts[] = ['type' => $type, 'msg' => $msg, 'link' => $link];
            }
        };
        $plural = fn (int $n, string $one, ?string $many = null) => $n.' '.($n === 1 ? $one : ($many ?? $one.'s'));

        $add((bool) Settings::get('maintenance_mode'), 'error', 'Maintenance mode is on: customers and dealers are locked out.', '/superadmin-system');

        $urgent = SupportTicket::whereIn('status', ['open', 'in_progress'])->where('priority', 'urgent')->count();
        $add($urgent > 0, 'error', $plural($urgent, 'urgent support ticket').' open', '/superadmin-support');
        $unassigned = SupportTicket::whereIn('status', ['open', 'in_progress'])->whereNull('assigned_to')->count();
        $add($unassigned > 0, 'warning', $plural($unassigned, 'open ticket').' with nobody assigned', '/superadmin-support');

        $docs = DealerDocument::where('status', '!=', 'superseded')->get();
        $states = $docs->map(fn (DealerDocument $d) => $d->state())->countBy();
        $add($states->get('pending_review', 0) > 0, 'warning', $plural($states->get('pending_review', 0), 'compliance document').' waiting for review', '/superadmin-compliance');
        $lapsed = $states->get('expired', 0) + $states->get('overdue', 0);
        $add($lapsed > 0, 'error', $plural($lapsed, 'dealer document').' expired or overdue', '/superadmin-compliance');

        $overdue = SubscriptionCharge::where('status', 'pending')->where('due_on', '<', today());
        $overdueCount = (clone $overdue)->count();
        $add($overdueCount > 0, 'warning', $plural($overdueCount, 'subscription charge').' overdue (KSh '.number_format((int) (clone $overdue)->sum('amount')).')', '/superadmin-subscriptions');

        $kyc = User::where('role', UserRole::Customer)->where('kyc_status', 'pending')->count();
        $add($kyc > 0, 'info', $plural($kyc, 'client').' waiting for KYC review', '/superadmin-clients');

        $payouts = Payout::where('status', PayoutStatus::Pending)->count();
        $add($payouts > 0, 'info', $plural($payouts, 'dealer payout').' ready to send', '/superadmin-payouts');

        $failed = AuditLog::where('action', 'auth.failed')->where('created_at', '>=', now()->subDay())->count();
        $add($failed >= 10, 'warning', "{$failed} failed sign-ins in the last 24 hours", '/superadmin-audit-logs');

        $heartbeat = Cache::get(self::SCHEDULER_HEARTBEAT);
        $add($heartbeat === null || now()->diffInMinutes($heartbeat) > 10, 'warning',
            'The task scheduler is not running, so monthly subscription billing won\'t happen on its own.', '/superadmin-integrations');

        return $alerts;
    }
}
