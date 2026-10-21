<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookings) {}

    /**
     * Bookings visible to the user: their own (customer), their dealership's
     * (dealer), or all of them (super admin).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::enum(BookingStatus::class)],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $bookings = Booking::query()
            ->visibleTo($request->user())
            ->with(['vehicle', 'dealer', 'invoice'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('reference', 'like', $term)->orWhere('customer_name', 'like', $term));
            })
            // Calendar views ask for bookings overlapping a window.
            ->when($request->filled('from'), fn ($q) => $q->where('return_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->where('pickup_at', '<=', $request->date('to')))
            ->orderByDesc('pickup_at')
            ->paginate(min($request->integer('per_page', 50), 200));

        return BookingResource::collection($bookings);
    }

    public function store(StoreBookingRequest $request): BookingResource
    {
        $booking = $this->bookings->create($request->user(), $request->validated());

        return new BookingResource($booking->load(['vehicle', 'dealer', 'invoice']));
    }

    public function show(Booking $booking): BookingResource
    {
        Gate::authorize('view', $booking);

        return new BookingResource($booking->load(['vehicle', 'dealer', 'invoice']));
    }

    public function updateStatus(Request $request, Booking $booking): BookingResource
    {
        Gate::authorize('view', $booking);
        $data = $request->validate(['status' => ['required', Rule::enum(BookingStatus::class)]]);
        $next = BookingStatus::from($data['status']);

        // Report an impossible transition as a validation error rather than "forbidden".
        if ($booking->status->canTransitionTo($next)) {
            Gate::authorize('changeStatus', [$booking, $next]);
        }

        $booking = $this->bookings->transition($booking, $next);

        return new BookingResource($booking->load(['vehicle', 'dealer', 'invoice']));
    }

    public function rate(Request $request, Booking $booking): BookingResource
    {
        Gate::authorize('rate', $booking);
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking->update([
            'rating' => $data['rating'],
            'review' => array_key_exists('review', $data) ? $data['review'] : $booking->review,
            'rated_at' => now(),
        ]);

        return new BookingResource($booking->load(['vehicle', 'dealer', 'invoice']));
    }
}
