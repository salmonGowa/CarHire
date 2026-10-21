<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Concerns\ScopesToDealer;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * A dealership's customers, derived from its bookings: everyone who has
 * booked with them, whether they have an account or were a walk-in.
 */
class DealerCustomerController extends Controller
{
    use ScopesToDealer;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeStaff($user);

        $bookings = $this->scopeToDealer(Booking::query(), $user)
            ->with(['vehicle', 'invoice'])
            ->withSum(['payments as paid' => fn ($q) => $q->where('status', PaymentStatus::Completed)], 'amount')
            ->orderByDesc('pickup_at')
            ->get();

        // Account holders group by account; walk-ins by name + phone.
        $customers = $bookings
            ->groupBy(fn (Booking $b) => $b->customer_id ? "u{$b->customer_id}" : 'w'.Str::slug($b->customer_name.' '.$b->customer_phone))
            ->map(fn (Collection $group, string $key) => $this->summarise($key, $group))
            ->values();

        if ($request->filled('search')) {
            $term = Str::lower($request->string('search'));
            $customers = $customers->filter(fn (array $c) => Str::contains(Str::lower("{$c['name']} {$c['email']} {$c['phone']}"), $term))->values();
        }

        return response()->json([
            'data' => $customers->sortByDesc('last_booking_at')->values(),
            'summary' => [
                'total' => $customers->count(),
                'repeat' => $customers->where('completed_trips', '>=', 2)->count(),
                'with_balance' => $customers->where('outstanding', '>', 0)->count(),
                'outstanding' => (int) $customers->sum('outstanding'),
            ],
        ]);
    }

    /**
     * @param  Collection<int, Booking>  $group  newest first
     * @return array<string, mixed>
     */
    private function summarise(string $key, Collection $group): array
    {
        $latest = $group->first();
        $kept = $group->where('status', '!=', BookingStatus::Cancelled);

        return [
            'key' => $key,
            'has_account' => $latest->customer_id !== null,
            'name' => $latest->customer_name,
            'email' => $group->pluck('customer_email')->filter()->first(),
            'phone' => $group->pluck('customer_phone')->filter()->first(),
            'trips' => $kept->count(),
            'completed_trips' => $group->where('status', BookingStatus::Completed)->count(),
            'cancellations' => $group->where('status', BookingStatus::Cancelled)->count(),
            'total_spent' => (int) $group->sum('paid'),
            'outstanding' => (int) $kept->sum(fn (Booking $b) => $b->invoice && ! $b->invoice->voided_at ? $b->invoice->balance() : 0),
            'average_rating_given' => $group->whereNotNull('rating')->avg('rating'),
            'first_booking_at' => $group->last()->pickup_at->toIso8601String(),
            'last_booking_at' => $latest->pickup_at->toIso8601String(),
            'last_vehicle' => $latest->vehicle?->model,
            'bookings' => $group->take(10)->map(fn (Booking $b) => [
                'id' => $b->id,
                'reference' => $b->reference,
                'status' => $b->status->value,
                'vehicle' => $b->vehicle?->model,
                'pickup_at' => $b->pickup_at->toIso8601String(),
                'total' => $b->total,
            ])->values(),
        ];
    }
}
