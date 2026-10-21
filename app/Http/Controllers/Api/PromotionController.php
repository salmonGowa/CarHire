<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\ScopesToDealer;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Promotion;
use App\Models\Vehicle;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class PromotionController extends Controller
{
    use ScopesToDealer;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeStaff($user);

        $promotions = $this->scopeToDealer(Promotion::query(), $user)
            ->withCount(['bookings as used' => fn ($q) => $q->where('status', '!=', BookingStatus::Cancelled)])
            ->when($request->filled('search'), fn ($q) => $q->where('code', 'like', '%'.$request->string('search').'%'))
            ->orderByDesc('expires_on')
            ->get();

        $promoBookings = fn () => $this->scopeToDealer(Booking::query(), $user)->whereNotNull('promotion_id')->where('status', '!=', BookingStatus::Cancelled);

        return response()->json([
            'data' => $promotions->map(fn (Promotion $p) => $this->present($p)),
            'summary' => [
                'active' => $promotions->filter(fn (Promotion $p) => $p->status($p->used) === 'active')->count(),
                'redeemed' => (int) $promotions->sum('used'),
                // Bookings won with a code this month, and what the codes cost.
                'revenue_this_month' => (int) $promoBookings()->where('created_at', '>=', now()->startOfMonth())->sum('total'),
                'discount_this_month' => (int) $promoBookings()->where('created_at', '>=', now()->startOfMonth())->sum('discount'),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeDealerStaff($user);
        $promotion = Promotion::create([...$this->validated($request, $user->dealer_id), 'dealer_id' => $user->dealer_id]);

        return response()->json(['data' => $this->present($promotion->loadCount('bookings as used'))], 201);
    }

    public function update(Request $request, Promotion $promotion): JsonResponse
    {
        $this->authorizeOwns($request->user(), $promotion);
        $promotion->update($this->validated($request, $promotion->dealer_id, $promotion));

        return response()->json(['data' => $this->present($promotion->loadCount(['bookings as used' => fn ($q) => $q->where('status', '!=', BookingStatus::Cancelled)]))]);
    }

    /**
     * A code that has been used is kept (bookings point at it); pause it instead.
     */
    public function destroy(Request $request, Promotion $promotion): Response
    {
        $this->authorizeOwns($request->user(), $promotion);
        abort_if($promotion->bookings()->exists(), 422, 'This code has been used on bookings. Pause it instead of deleting it.');
        $promotion->delete();

        return response()->noContent();
    }

    /**
     * Preview a code for a vehicle and dates before booking. Any signed-in user.
     */
    public function check(Request $request, BookingService $bookings): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'pickup_at' => ['required', 'date'],
            'return_at' => ['required', 'date', 'after:pickup_at'],
        ]);
        $vehicle = Vehicle::findOrFail($data['vehicle_id']);
        $promotion = $bookings->redeemablePromotion($vehicle->dealer_id, $data['code']);

        return response()->json([
            'code' => $promotion->code,
            'description' => $promotion->type === 'percentage' ? "{$promotion->value}% off" : 'KSh '.number_format($promotion->value).' off',
            ...Booking::quote($vehicle->daily_rate, Carbon::parse($data['pickup_at']), Carbon::parse($data['return_at']), $promotion),
        ]);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, int $dealerId, ?Promotion $existing = null): array
    {
        $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);

        return $request->validate([
            'code' => ['required', 'string', 'max:40', 'regex:/^[A-Z0-9_-]+$/', Rule::unique('promotions')->where('dealer_id', $dealerId)->ignore($existing)],
            'type' => ['required', Rule::in(['percentage', 'flat'])],
            'value' => ['required', 'integer', 'min:1', $request->input('type') === 'percentage' ? 'max:100' : 'max:1000000'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_on' => ['required', 'date', $existing ? 'date' : 'after_or_equal:today'],
            'is_active' => ['sometimes', 'boolean'],
        ], ['code.regex' => 'Use letters, numbers, dashes or underscores only.', 'code.unique' => 'You already have a code with that name.']);
    }

    /** @return array<string, mixed> */
    private function present(Promotion $p): array
    {
        $used = (int) ($p->used ?? 0);

        return [
            'id' => $p->id,
            'code' => $p->code,
            'type' => $p->type,
            'value' => $p->value,
            'max_uses' => $p->max_uses,
            'used' => $used,
            'expires_on' => $p->expires_on->toDateString(),
            'is_active' => $p->is_active,
            'status' => $p->status($used),
        ];
    }
}
