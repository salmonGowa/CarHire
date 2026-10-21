<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\ScopesToDealer;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    use ScopesToDealer;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeStaff($user);

        $drivers = $this->scopeToDealer(Driver::query(), $user)
            ->withCount(['bookings as completed_trips' => fn ($q) => $q->where('status', BookingStatus::Completed)])
            ->withAvg(['bookings as average_rating' => fn ($q) => $q->whereNotNull('rating')], 'rating')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderByDesc('is_active')->orderBy('name')
            ->get();

        $current = Booking::query()->with('vehicle')->where('status', BookingStatus::Active)
            ->whereIn('driver_id', $drivers->pluck('id'))->get()->keyBy('driver_id');

        return response()->json(['data' => $drivers->map(fn (Driver $d) => $this->present($d, $current->get($d->id)))]);
    }

    public function show(Request $request, Driver $driver): JsonResponse
    {
        $user = $request->user();
        $this->authorizeStaff($user);
        abort_unless($user->isSuperAdmin() || $driver->dealer_id === $user->dealer_id, 404);

        $driver->loadCount(['bookings as completed_trips' => fn ($q) => $q->where('status', BookingStatus::Completed)])
            ->loadAvg(['bookings as average_rating' => fn ($q) => $q->whereNotNull('rating')], 'rating');
        $trips = $driver->bookings()->with('vehicle')->where('status', '!=', BookingStatus::Cancelled)->orderByDesc('pickup_at')->limit(20)->get();

        return response()->json(['data' => [
            ...$this->present($driver, $trips->firstWhere('status', BookingStatus::Active)),
            'trips' => $trips->map(fn (Booking $b) => [
                'id' => $b->id,
                'reference' => $b->reference,
                'status' => $b->status->value,
                'customer_name' => $b->customer_name,
                'vehicle' => $b->vehicle ? "{$b->vehicle->model} ({$b->vehicle->plate})" : null,
                'pickup_location' => $b->pickup_location,
                'pickup_at' => $b->pickup_at->toIso8601String(),
                'return_at' => $b->return_at->toIso8601String(),
                'rating' => $b->rating,
            ]),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeDealerStaff($user);
        $driver = Driver::create([...$this->validated($request), 'dealer_id' => $user->dealer_id, 'joined_on' => $request->input('joined_on') ?? today()]);

        return response()->json(['data' => $this->present($driver)], 201);
    }

    public function update(Request $request, Driver $driver): JsonResponse
    {
        $this->authorizeOwns($request->user(), $driver);
        $driver->update($this->validated($request));

        return response()->json(['data' => $this->present($driver)]);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:30'],
            'license_class' => ['required', 'string', 'max:40'],
            'license_number' => ['nullable', 'string', 'max:40'],
            'license_expires_on' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
            'joined_on' => ['nullable', 'date'],
            'photo_url' => ['nullable', 'url', 'max:2048'],
            'license_image_url' => ['nullable', 'url', 'max:2048'],
        ]);
    }

    /** @return array<string, mixed> */
    private function present(Driver $d, ?Booking $current = null): array
    {
        return [
            'id' => $d->id,
            'reference' => 'DRV-'.str_pad((string) $d->id, 3, '0', STR_PAD_LEFT),
            'name' => $d->name,
            'phone' => $d->phone,
            'license_class' => $d->license_class,
            'license_number' => $d->license_number,
            'license_expires_on' => $d->license_expires_on?->toDateString(),
            'license_expired' => $d->license_expires_on?->isPast() ?? false,
            'is_active' => $d->is_active,
            'joined_on' => $d->joined_on?->toDateString(),
            'photo_url' => $d->photo_url,
            'license_image_url' => $d->license_image_url,
            'completed_trips' => (int) ($d->completed_trips ?? 0),
            'average_rating' => $d->average_rating !== null ? round((float) $d->average_rating, 1) : null,
            'current_assignment' => $current ? [
                'booking_reference' => $current->reference,
                'vehicle' => $current->vehicle ? "{$current->vehicle->model} ({$current->vehicle->plate})" : null,
                'customer_name' => $current->customer_name,
                'return_at' => $current->return_at->toIso8601String(),
            ] : null,
        ];
    }
}
