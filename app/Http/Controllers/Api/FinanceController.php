<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentStatus;
use App\Enums\PayoutStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Payout;
use App\Support\Settings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    /**
     * Money totals and trends for dealer staff (their dealership) or super
     * admins (the whole platform). Built from completed payments.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isSuperAdmin() || $user->isDealer(), 403);
        $months = min(max($request->integer('months', 6), 1), 24);

        $scope = fn ($q) => $user->isSuperAdmin() ? $q : $q->where('dealer_id', $user->dealer_id);
        $from = now()->startOfMonth()->subMonths($months - 1);

        $payments = Payment::query()->tap($scope)
            ->where('status', PaymentStatus::Completed)
            ->where('paid_at', '>=', min($from, now()->subDays(6)->startOfDay()))
            ->get(['amount', 'vat', 'commission', 'paid_at']);

        $sum = fn ($rows) => [
            'gross' => (int) $rows->sum('amount'),
            'vat' => (int) $rows->sum('vat'),
            'commission' => (int) $rows->sum('commission'),
            'net' => (int) ($rows->sum('amount') - $rows->sum('vat') - $rows->sum('commission')),
            'count' => $rows->count(),
        ];

        $monthly = collect(range($months - 1, 0))->map(function (int $ago) use ($payments, $sum) {
            $start = now()->startOfMonth()->subMonths($ago);
            $rows = $payments->filter(fn ($p) => $p->paid_at->isSameMonth($start));

            return ['month' => $start->format('Y-m'), 'label' => $start->format('M')] + $sum($rows);
        })->values();

        $daily = collect(range(6, 0))->map(function (int $ago) use ($payments) {
            $day = now()->subDays($ago);
            $rows = $payments->filter(fn ($p) => $p->paid_at->isSameDay($day));

            return ['date' => $day->toDateString(), 'label' => $day->format('D'), 'gross' => (int) $rows->sum('amount')];
        })->values();

        $pending = Payout::query()->tap($scope)->where('status', PayoutStatus::Pending);
        $lastPaid = Payout::query()->tap($scope)->where('status', PayoutStatus::Paid)->latest('paid_at')->first();
        $unsettled = Payment::query()->tap($scope)->where('status', PaymentStatus::Completed)->whereNull('payout_id')->get(['amount', 'commission', 'method']);

        return response()->json([
            'commission_rate' => (float) Settings::get('commission_rate'),
            'vat_rate' => (float) config('drivefleet.vat_rate'),
            'month_to_date' => $sum($payments->filter(fn ($p) => $p->paid_at->gte(now()->startOfMonth()))),
            'previous_month' => $sum(Payment::query()->tap($scope)->where('status', PaymentStatus::Completed)
                ->whereBetween('paid_at', [now()->subMonthNoOverflow()->startOfMonth(), now()->subMonthNoOverflow()->endOfMonth()])
                ->get(['amount', 'vat', 'commission'])),
            'monthly' => $monthly,
            'last_7_days' => $daily,
            'outstanding' => (int) Invoice::query()->tap($scope)->whereNull('voided_at')->selectRaw('COALESCE(SUM(GREATEST(CAST(total AS SIGNED) - CAST(amount_paid AS SIGNED), 0)), 0) as due')->value('due'),
            'payouts' => [
                'pending_count' => (clone $pending)->count(),
                'pending_net' => (int) (clone $pending)->sum('net'),
                // Not yet in any payout: what the next cycle will settle.
                'unsettled_net' => (int) ($unsettled->filter(fn ($p) => $p->method->collectedByPlatform())->sum('amount') - $unsettled->sum('commission')),
                'last_paid_at' => $lastPaid?->paid_at?->toIso8601String(),
                'last_paid_net' => $lastPaid?->net,
            ],
        ]);
    }
}
