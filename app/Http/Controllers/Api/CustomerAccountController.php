<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Payment;
use App\Support\CustomerTier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer-only views: loyalty standing and the current trip.
 */
class CustomerAccountController extends Controller
{
    /** Points per KSh spent on completed payments, and per review left. */
    public const KSH_PER_POINT = 100;

    public const POINTS_PER_REVIEW = 50;

    public function rewards(Request $request): JsonResponse
    {
        $user = $request->user();
        $payments = Payment::where('customer_id', $user->id)->where('status', PaymentStatus::Completed)->get(['booking_id', 'amount', 'paid_at']);
        $ltv = (int) $payments->sum('amount');
        $bookings = Booking::with('vehicle')->where('customer_id', $user->id)->where('status', BookingStatus::Completed)->orderByDesc('return_at')->get();
        $paidByBooking = $payments->groupBy('booking_id')->map->sum('amount');

        $history = $bookings->flatMap(function (Booking $b) use ($paidByBooking) {
            $rows = [];
            $paid = (int) ($paidByBooking[$b->id] ?? 0);
            if ($paid > 0) {
                $rows[] = ['at' => $b->return_at->toIso8601String(), 'label' => "Trip in the {$b->vehicle?->model} ({$b->reference})", 'points' => intdiv($paid, self::KSH_PER_POINT)];
            }
            if ($b->rating !== null) {
                $rows[] = ['at' => ($b->rated_at ?? $b->return_at)->toIso8601String(), 'label' => "Reviewed {$b->reference}", 'points' => self::POINTS_PER_REVIEW];
            }

            return $rows;
        })->sortByDesc('at')->values();

        return response()->json([
            'points' => (int) $history->sum('points'),
            'lifetime_value' => $ltv,
            'tier' => CustomerTier::for($ltv),
            'next_tier' => CustomerTier::next($ltv),
            'tiers' => collect(CustomerTier::TIERS)->map(fn ($name, $min) => ['name' => $name, 'threshold' => $min])->sortBy('threshold')->values(),
            'completed_trips' => $bookings->count(),
            'reviews' => $bookings->whereNotNull('rating')->count(),
            'unrated' => $bookings->whereNull('rating')->count(),
            'history' => $history->take(30),
            'rules' => ['ksh_per_point' => self::KSH_PER_POINT, 'points_per_review' => self::POINTS_PER_REVIEW],
        ]);
    }

    /** The trip in progress, or else the next one coming up. */
    public function currentTrip(Request $request): JsonResponse
    {
        $user = $request->user();
        $base = fn () => Booking::with(['vehicle', 'dealer', 'invoice', 'charges', 'inspections', 'extensions'])->where('customer_id', $user->id);

        $booking = $base()->where('status', BookingStatus::Active)->orderBy('return_at')->first()
            ?? $base()->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Pending])->where('return_at', '>=', now())->orderBy('pickup_at')->first();
        $upcoming = $base()->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Pending])->where('return_at', '>=', now())->count();

        return response()->json([
            'data' => $booking ? [
                'booking' => (new BookingResource($booking))->resolve($request),
                'dealer' => $booking->dealer?->only(['name', 'city', 'county', 'address', 'phone', 'email']),
                'vehicle' => $booking->vehicle?->only(['model', 'plate', 'type', 'seats', 'transmission', 'fuel_type', 'image_url', 'year']),
            ] : null,
            'upcoming' => $upcoming,
        ]);
    }
}
