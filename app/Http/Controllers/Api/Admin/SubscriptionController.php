<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\DealerStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dealer;
use App\Models\SubscriptionCharge;
use App\Models\SubscriptionPlan;
use App\Services\SubscriptionBilling;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class SubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['status' => ['nullable', Rule::in(['pending', 'overdue', 'paid', 'void'])]]);

        $dealers = Dealer::with('plan')->withCount(['vehicles', 'staff'])
            ->withSum(['subscriptionCharges as outstanding' => fn ($q) => $q->where('status', 'pending')], 'amount')
            ->orderBy('name')->get();
        $latest = SubscriptionCharge::whereIn('id', SubscriptionCharge::selectRaw('max(id)')->groupBy('dealer_id'))->get()->keyBy('dealer_id');

        $charges = SubscriptionCharge::with('dealer')
            ->when($request->input('status') === 'overdue', fn ($q) => $q->where('status', 'pending')->where('due_on', '<', today()))
            ->when($request->input('status') === 'pending', fn ($q) => $q->where('status', 'pending')->where('due_on', '>=', today()))
            ->when(in_array($request->input('status'), ['paid', 'void'], true), fn ($q) => $q->where('status', $request->input('status')))
            ->latest('period_start')->latest('id')->limit(200)->get();

        $active = $dealers->filter(fn (Dealer $d) => $d->status === DealerStatus::Active && $d->plan);
        $overdue = SubscriptionCharge::where('status', 'pending')->where('due_on', '<', today());
        $thisMonth = today()->startOfMonth();
        $billed = SubscriptionCharge::whereDate('period_start', $thisMonth)->pluck('dealer_id')->flip();

        return response()->json([
            'plans' => SubscriptionPlan::withCount('dealers')->orderBy('sort_order')->get()->map(fn (SubscriptionPlan $p) => $this->presentPlan($p)),
            'dealers' => $dealers->map(fn (Dealer $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'status' => $d->status->value,
                'plan' => $d->plan ? ['id' => $d->plan->id, 'name' => $d->plan->name, 'monthly_fee' => $d->plan->monthly_fee] : null,
                'vehicles' => $d->vehicles_count,
                'vehicle_limit' => $d->plan?->vehicle_limit,
                'staff' => $d->staff_count,
                'staff_limit' => $d->plan?->staff_limit,
                'outstanding' => (int) $d->outstanding,
                'latest_charge' => isset($latest[$d->id]) ? $this->presentCharge($latest[$d->id]->setRelation('dealer', $d)) : null,
            ]),
            'charges' => $charges->map(fn (SubscriptionCharge $c) => $this->presentCharge($c)),
            'summary' => [
                'mrr' => $active->sum(fn (Dealer $d) => $d->plan->monthly_fee),
                'active_subscriptions' => $active->count(),
                'without_plan' => $dealers->where('status', DealerStatus::Active)->whereNull('subscription_plan_id')->count(),
                'overdue_count' => (clone $overdue)->count(),
                'overdue_amount' => (int) (clone $overdue)->sum('amount'),
                'collected_this_month' => (int) SubscriptionCharge::where('status', 'paid')->where('paid_at', '>=', $thisMonth)->sum('amount'),
                'current_period' => $thisMonth->toDateString(),
                'unbilled_this_month' => $active->filter(fn (Dealer $d) => $d->plan->monthly_fee > 0 && ! $billed->has($d->id))->count(),
            ],
        ]);
    }

    public function updatePlan(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $data = $request->validate([
            'monthly_fee' => ['required', 'integer', 'min:0', 'max:10000000'],
            'vehicle_limit' => ['nullable', 'integer', 'min:1'],
            'staff_limit' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);
        $before = $plan->monthly_fee;
        $plan->update($data);
        AuditLog::record('plan.updated', "Updated the {$plan->name} plan".($before !== $plan->monthly_fee ? " (KSh {$before} → KSh {$plan->monthly_fee}/month)" : ''), $plan, 'warning');

        return response()->json(['data' => $this->presentPlan($plan->loadCount('dealers'))]);
    }

    public function assign(Request $request, Dealer $dealer): JsonResponse
    {
        $data = $request->validate(['subscription_plan_id' => ['nullable', 'integer', 'exists:subscription_plans,id']]);
        $plan = $data['subscription_plan_id'] ? SubscriptionPlan::find($data['subscription_plan_id']) : null;

        if ($plan?->vehicle_limit !== null && $dealer->vehicles()->count() > $plan->vehicle_limit) {
            abort(422, "{$dealer->name} has {$dealer->vehicles()->count()} vehicles; the {$plan->name} plan allows {$plan->vehicle_limit}.");
        }
        if ($plan?->staff_limit !== null && $dealer->staff()->count() > $plan->staff_limit) {
            abort(422, "{$dealer->name} has {$dealer->staff()->count()} staff logins; the {$plan->name} plan allows {$plan->staff_limit}.");
        }

        $dealer->update(['subscription_plan_id' => $plan?->id]);
        AuditLog::record('dealer.plan_changed', "Moved {$dealer->name} to ".($plan ? "the {$plan->name} plan" : 'no plan'), $dealer);

        return response()->json(['data' => ['id' => $dealer->id, 'plan' => $plan?->only(['id', 'name', 'monthly_fee'])]]);
    }

    public function issue(Request $request, SubscriptionBilling $billing): JsonResponse
    {
        $data = $request->validate(['month' => ['nullable', 'date_format:Y-m']]);
        $month = isset($data['month']) ? Carbon::createFromFormat('Y-m-d', $data['month'].'-01') : today();
        abort_if($month->copy()->startOfMonth()->gt(today()->startOfMonth()), 422, "Charges can't be raised for future months.");

        return response()->json(['created' => $billing->issue($month, $request->user())]);
    }

    public function pay(Request $request, SubscriptionCharge $charge, SubscriptionBilling $billing): JsonResponse
    {
        $data = $request->validate([
            'method' => ['required', new Enum(PaymentMethod::class)],
            'transaction_ref' => ['nullable', 'string', 'max:60'],
        ]);
        $charge = $billing->recordPayment($charge, PaymentMethod::from($data['method']), $data['transaction_ref'] ?? null, $request->user());

        return response()->json(['data' => $this->presentCharge($charge->load('dealer'))]);
    }

    public function void(Request $request, SubscriptionCharge $charge, SubscriptionBilling $billing): JsonResponse
    {
        return response()->json(['data' => $this->presentCharge($billing->void($charge, $request->user())->load('dealer'))]);
    }

    /** The signed-in dealer's own plan, usage and charges. */
    public function mine(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;
        abort_unless($dealer, 403);
        $dealer->load('plan')->loadCount(['vehicles', 'staff']);

        return response()->json([
            'plan' => $dealer->plan ? $this->presentPlan($dealer->plan) : null,
            'usage' => ['vehicles' => $dealer->vehicles_count, 'staff' => $dealer->staff_count],
            'plans' => SubscriptionPlan::orderBy('sort_order')->get()->map(fn (SubscriptionPlan $p) => $this->presentPlan($p)),
            'charges' => $dealer->subscriptionCharges()->latest('period_start')->limit(24)->get()
                ->map(fn (SubscriptionCharge $c) => $this->presentCharge($c->setRelation('dealer', $dealer))),
        ]);
    }

    /** @return array<string, mixed> */
    private function presentPlan(SubscriptionPlan $p): array
    {
        return [
            ...$p->only(['id', 'name', 'monthly_fee', 'vehicle_limit', 'staff_limit', 'description']),
            'dealers' => $p->dealers_count ?? null,
        ];
    }

    /** @return array<string, mixed> */
    private function presentCharge(SubscriptionCharge $c): array
    {
        return [
            'id' => $c->id,
            'reference' => $c->reference,
            'dealer' => ['id' => $c->dealer->id, 'name' => $c->dealer->name],
            'plan' => $c->plan_name,
            'amount' => $c->amount,
            'period' => $c->period_start->toDateString(),
            'due_on' => $c->due_on->toDateString(),
            'status' => $c->state(),
            'method' => $c->method?->value,
            'transaction_ref' => $c->transaction_ref,
            'paid_at' => $c->paid_at?->toIso8601String(),
        ];
    }
}
