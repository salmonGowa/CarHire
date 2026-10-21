<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDealer;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Reviews are the ratings customers leave on completed bookings.
 */
class ReviewController extends Controller
{
    use ScopesToDealer;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeStaff($user);
        $rated = fn () => $this->scopeToDealer(Booking::query(), $user)->whereNotNull('rating');

        $reviews = $rated()
            ->with('vehicle')
            ->when($request->input('filter') === 'unanswered', fn ($q) => $q->whereNotNull('review')->whereNull('review_reply'))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('customer_name', 'like', $term)->orWhere('review', 'like', $term));
            })
            ->orderByDesc('rated_at')->orderByDesc('updated_at')
            ->limit(200)
            ->get();

        $total = $rated()->count();

        return response()->json([
            'data' => $reviews->map(fn (Booking $b) => [
                'booking_id' => $b->id,
                'booking_reference' => $b->reference,
                'customer_name' => $b->customer_name,
                'rating' => $b->rating,
                'review' => $b->review,
                'rated_at' => ($b->rated_at ?? $b->updated_at)->toIso8601String(),
                'vehicle' => $b->vehicle?->model,
                'reply' => $b->review_reply,
                'replied_at' => $b->replied_at?->toIso8601String(),
            ]),
            'summary' => [
                'average' => $total ? round((float) $rated()->avg('rating'), 1) : null,
                'total' => $total,
                'five_star_share' => $total ? (int) round($rated()->where('rating', 5)->count() / $total * 100) : null,
                'awaiting_reply' => $rated()->whereNotNull('review')->whereNull('review_reply')->count(),
            ],
        ]);
    }

    public function reply(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeOwns($request->user(), $booking);
        abort_if($booking->rating === null, 422, "This booking hasn't been reviewed.");
        $data = $request->validate(['reply' => ['required', 'string', 'max:1000']]);

        $booking->update(['review_reply' => $data['reply'], 'replied_at' => now()]);

        return response()->json(['data' => ['reply' => $booking->review_reply, 'replied_at' => $booking->replied_at->toIso8601String()]]);
    }
}
