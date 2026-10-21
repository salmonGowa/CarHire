<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\ScopesToDealer;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Hire agreements are the contract side of a booking: self-drive or
 * chauffeured (with an assigned driver), signed by the client at handover.
 */
class AgreementController extends Controller
{
    use ScopesToDealer;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeStaff($user);

        $bookings = $this->scopeToDealer(Booking::query(), $user)
            ->with(['vehicle', 'driver', 'dealer'])
            ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Active, BookingStatus::Completed, BookingStatus::Cancelled])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('reference', 'like', $term)->orWhere('customer_name', 'like', $term));
            })
            ->orderByDesc('pickup_at')
            ->limit(200)
            ->get();

        $scope = fn () => $this->scopeToDealer(Booking::query(), $user);

        return response()->json([
            'data' => $bookings->map(fn (Booking $b) => $this->present($b)),
            'summary' => [
                'signed_today' => $scope()->whereDate('agreement_signed_at', today())->count(),
                'awaiting_signature' => $scope()->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Active])->whereNull('agreement_signed_at')->count(),
                'chauffeur_upcoming' => $scope()->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Active])->where('agreement_type', 'chauffeur')->count(),
            ],
        ]);
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeOwns($request->user(), $booking);
        $this->assertOpen($booking);

        $data = $request->validate([
            'agreement_type' => ['required', Rule::in(['self_drive', 'chauffeur'])],
            'driver_id' => [
                Rule::requiredIf($request->input('agreement_type') === 'chauffeur'), 'nullable', 'integer',
                Rule::exists('drivers', 'id')->where('dealer_id', $booking->dealer_id)->where('is_active', true),
            ],
        ], ['driver_id.required' => 'Chauffeured hires need a driver.', 'driver_id.exists' => 'Choose an active driver from your team.']);

        if ($data['agreement_type'] === 'self_drive') {
            $data['driver_id'] = null;
        } elseif (Driver::find($data['driver_id'])->isBookedBetween($booking->pickup_at, $booking->return_at, $booking->id)) {
            throw ValidationException::withMessages(['driver_id' => 'That driver is already assigned to another booking at that time.']);
        }

        // Changing the terms means the client must sign again.
        $booking->update([...$data, 'agreement_signed_at' => null]);

        return response()->json(['data' => $this->present($booking->load(['vehicle', 'driver', 'dealer']))]);
    }

    public function sign(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeOwns($request->user(), $booking);
        $this->assertOpen($booking);
        abort_if($booking->agreement_type === 'chauffeur' && $booking->driver_id === null, 422, 'Assign a driver before signing a chauffeured hire.');

        $booking->update(['agreement_signed_at' => now()]);
        AuditLog::record('agreement.signed', "Hire agreement signed for {$booking->reference}", $booking);

        return response()->json(['data' => $this->present($booking->load(['vehicle', 'driver', 'dealer']))]);
    }

    private function assertOpen(Booking $booking): void
    {
        abort_unless(in_array($booking->status, [BookingStatus::Confirmed, BookingStatus::Active], true), 422,
            'Agreements can only be changed while the booking is confirmed or active.');
    }

    /** @return array<string, mixed> */
    private function present(Booking $b): array
    {
        $status = match (true) {
            $b->status === BookingStatus::Cancelled => 'void',
            $b->agreement_signed_at !== null => $b->status === BookingStatus::Completed ? 'closed' : 'signed',
            $b->status === BookingStatus::Completed => 'unsigned',
            default => 'pending_signature',
        };

        return [
            'booking_id' => $b->id,
            'reference' => 'AGR-'.substr($b->reference, 4),
            'booking_reference' => $b->reference,
            'status' => $status,
            'booking_status' => $b->status->value,
            'agreement_type' => $b->agreement_type,
            'signed_at' => $b->agreement_signed_at?->toIso8601String(),
            'customer' => ['name' => $b->customer_name, 'phone' => $b->customer_phone, 'email' => $b->customer_email, 'id_number' => $b->customer_id_number],
            'vehicle' => $b->vehicle ? ['model' => $b->vehicle->model, 'plate' => $b->vehicle->plate] : null,
            'driver' => $b->driver ? ['id' => $b->driver->id, 'name' => $b->driver->name, 'phone' => $b->driver->phone, 'license_class' => $b->driver->license_class] : null,
            'dealer' => $b->dealer ? ['name' => $b->dealer->name, 'city' => $b->dealer->city, 'address' => $b->dealer->address, 'phone' => $b->dealer->phone] : null,
            'pickup_at' => $b->pickup_at->toIso8601String(),
            'return_at' => $b->return_at->toIso8601String(),
            'pickup_location' => $b->pickup_location,
            'days' => $b->days,
            'total' => $b->total,
            'editable' => in_array($b->status, [BookingStatus::Confirmed, BookingStatus::Active], true),
        ];
    }
}
