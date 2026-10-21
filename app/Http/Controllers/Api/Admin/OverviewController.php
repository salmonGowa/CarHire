<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Dealer;
use App\Models\Payment;
use App\Services\PlatformAlerts;
use Illuminate\Http\JsonResponse;

/**
 * The super admin dashboard: leaderboard, what needs attention, newest dealers.
 */
class OverviewController extends Controller
{
    public function __invoke(PlatformAlerts $alerts): JsonResponse
    {
        $revenue = Payment::where('status', PaymentStatus::Completed)->where('paid_at', '>=', now()->startOfMonth())
            ->selectRaw('dealer_id, sum(amount) as gross, count(*) as payments')->groupBy('dealer_id')
            ->orderByDesc('gross')->limit(5)->get();
        $dealers = Dealer::whereIn('id', $revenue->pluck('dealer_id'))->get()->keyBy('id');
        $top = (int) ($revenue->max('gross') ?? 0);

        return response()->json([
            'top_dealers' => $revenue->map(fn ($r) => [
                'id' => (int) $r->dealer_id,
                'name' => $dealers[$r->dealer_id]->name ?? 'Deleted dealer',
                'city' => $dealers[$r->dealer_id]->city ?? null,
                'gross' => (int) $r->gross,
                'payments' => (int) $r->payments,
                'percentage' => $top > 0 ? (int) round($r->gross / $top * 100) : 0,
            ])->values(),
            'attention' => $alerts->current(),
            'recent_dealers' => Dealer::with('plan')->withCount('vehicles')->latest()->latest('id')->limit(5)->get()->map(fn (Dealer $d) => [
                'id' => $d->id,
                'reference' => 'DLR-'.str_pad((string) $d->id, 3, '0', STR_PAD_LEFT),
                'name' => $d->name,
                'plan' => $d->plan?->name,
                'joined' => $d->created_at->toIso8601String(),
                'vehicles' => $d->vehicles_count,
                'status' => $d->status->value,
            ]),
        ]);
    }
}
