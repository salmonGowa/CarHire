<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PayoutResource;
use App\Models\Payout;
use App\Services\FinanceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class PayoutController extends Controller
{
    public function __construct(private FinanceService $finance) {}

    /**
     * Super admins see every payout; dealer staff see their dealership's.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        abort_unless($user->isSuperAdmin() || $user->isDealer(), 403);

        $payouts = Payout::query()
            ->with('dealer')
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->where('dealer_id', $user->dealer_id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), fn ($q) => $q->whereHas('dealer', fn ($d) => $d->where('name', 'like', '%'.$request->string('search').'%')))
            ->latest()
            ->paginate(min($request->integer('per_page', 50), 200));

        return PayoutResource::collection($payouts);
    }

    /**
     * Run a payout cycle: settle everything paid up to the given time (default now).
     */
    public function generate(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate(['until' => ['nullable', 'date', 'before_or_equal:now']]);
        $until = isset($data['until']) ? Carbon::parse($data['until'])->endOfDay()->min(now()) : now();

        $payouts = $this->finance->generatePayouts($request->user(), $until);

        return PayoutResource::collection($payouts->each->load('dealer'));
    }

    public function markPaid(Request $request, Payout $payout): PayoutResource
    {
        $data = $request->validate(['transfer_reference' => ['required', 'string', 'max:60']]);

        return new PayoutResource($this->finance->markPaid($payout, $data['transfer_reference'])->load('dealer'));
    }
}
