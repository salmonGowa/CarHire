<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\BookingExtension;
use App\Models\BookingInspection;
use App\Services\RentalOperations;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Handover, return, deposits and extensions (see RentalOperations), plus the
 * dealer's rental policy.
 */
class RentalController extends Controller
{
    private const RELATIONS = ['vehicle', 'dealer', 'invoice', 'charges', 'inspections', 'extensions'];

    private const METHODS = ['mpesa', 'cash', 'card', 'bank'];

    public function __construct(private RentalOperations $rentals) {}

    public function handover(Request $request, Booking $booking): BookingResource
    {
        Gate::authorize('operate', $booking);
        $data = $request->validate([
            ...$this->conditionRules(),
            'deposit_received' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'deposit_method' => [Rule::requiredIf(fn () => $request->integer('deposit_received') > 0), 'nullable', Rule::in(self::METHODS)],
            'deposit_reference' => [Rule::requiredIf(fn () => in_array($request->input('deposit_method'), ['mpesa', 'bank'], true) && $request->integer('deposit_received') > 0), 'nullable', 'string', 'max:60'],
        ], $this->messages());

        $booking = $this->rentals->handover($request->user(), $booking, $data, $request->file('photos', []));

        return new BookingResource($booking->load(self::RELATIONS));
    }

    public function returnQuote(Request $request, Booking $booking): JsonResponse
    {
        Gate::authorize('operate', $booking);
        $data = $request->validate([
            'odometer' => ['required', 'integer', 'min:0'],
            'fuel_level' => ['required', 'integer', 'between:0,100'],
            'damage_amount' => ['nullable', 'integer', 'min:0'],
        ]);
        $booking->load(['dealer', 'invoice']);

        return response()->json(['data' => $this->rentals->quoteReturn($booking, $data['odometer'], $data['fuel_level'], (int) ($data['damage_amount'] ?? 0))]);
    }

    public function receiveReturn(Request $request, Booking $booking): BookingResource
    {
        Gate::authorize('operate', $booking);
        $data = $request->validate([
            ...$this->conditionRules(),
            'damage_amount' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'damage_description' => ['required_with:damage_amount', 'nullable', 'string', 'max:255'],
            'settle_deposit' => ['boolean'],
            'refund_method' => ['nullable', Rule::in(self::METHODS)],
            'refund_reference' => ['nullable', 'string', 'max:60'],
        ], $this->messages());
        if (blank($data['damage_amount'] ?? null)) {
            unset($data['damage_description']);
        }
        $data['settle_deposit'] = $request->boolean('settle_deposit', true);

        $booking = $this->rentals->receiveReturn($request->user(), $booking->load('dealer'), $data, $request->file('photos', []));

        return new BookingResource($booking->load(self::RELATIONS));
    }

    public function settleDeposit(Request $request, Booking $booking): BookingResource
    {
        Gate::authorize('operate', $booking);
        $data = $request->validate([
            'refund_method' => ['nullable', Rule::in(self::METHODS)],
            'refund_reference' => ['nullable', 'string', 'max:60'],
        ]);

        return new BookingResource($this->rentals->settleDeposit($request->user(), $booking, $data['refund_method'] ?? null, $data['refund_reference'] ?? null)->load(self::RELATIONS));
    }

    public function requestExtension(Request $request, Booking $booking): BookingResource
    {
        Gate::authorize('requestExtension', $booking);
        $data = $request->validate(['return_at' => ['required', 'date']]);
        $this->rentals->requestExtension($request->user(), $booking->load('vehicle'), Carbon::parse($data['return_at'])->setTimezone(config('app.timezone')));

        return new BookingResource($booking->fresh()->load(self::RELATIONS));
    }

    public function decideExtension(Request $request, BookingExtension $extension): BookingResource
    {
        Gate::authorize('operate', $extension->booking);
        $data = $request->validate([
            'decision' => ['required', Rule::in(['approve', 'decline'])],
            'note' => ['nullable', 'string', 'max:255'],
        ]);
        $this->rentals->decideExtension($request->user(), $extension, $data['decision'] === 'approve', $data['note'] ?? null);

        return new BookingResource($extension->booking->fresh()->load(self::RELATIONS));
    }

    public function photo(Request $request, BookingInspection $inspection, int $index): StreamedResponse
    {
        Gate::authorize('view', $inspection->booking);
        $path = $inspection->photos[$index] ?? null;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }

    public function policy(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;
        abort_unless($dealer, 403);

        return response()->json(['data' => $dealer->policy(), 'can_edit' => $request->user()->isDealerManager()]);
    }

    public function updatePolicy(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isDealerManager(), 403, "Only your dealership's managers can change the rental policy.");
        $data = $request->validate([
            'deposit_amount' => ['required', 'integer', 'min:0', 'max:1000000'],
            'late_grace_minutes' => ['required', 'integer', 'min:0', 'max:1440'],
            'late_fee_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'fuel_charge_per_percent' => ['required', 'integer', 'min:0', 'max:10000'],
            'included_km_per_day' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'extra_km_rate' => ['required', 'integer', 'min:0', 'max:10000'],
        ]);
        $user->dealer->update($data);
        AuditLog::record('dealer.policy_updated', "Updated the rental policy for {$user->dealer->name}", $user->dealer);

        return response()->json(['data' => $user->dealer->policy(), 'can_edit' => true]);
    }

    /** @return array<string, list<mixed>> */
    private function conditionRules(): array
    {
        return [
            'odometer' => ['required', 'integer', 'min:0', 'max:2000000'],
            'fuel_level' => ['required', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'photos' => ['nullable', 'array', 'max:8'],
            'photos.*' => ['image', 'max:8192'],
        ];
    }

    /** @return array<string, string> */
    private function messages(): array
    {
        return [
            'photos.max' => 'Add up to 8 photos.',
            'photos.*.image' => 'Photos must be images.',
            'photos.*.max' => 'Each photo can be up to 8 MB.',
            'deposit_method.required' => 'Say how the deposit was paid.',
            'deposit_reference.required' => 'Enter the M-PESA or bank reference for the deposit.',
            'damage_description.required_with' => 'Describe the damage being charged for.',
        ];
    }
}
