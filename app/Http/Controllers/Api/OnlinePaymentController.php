<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OnlinePaymentResource;
use App\Models\Booking;
use App\Models\OnlinePayment;
use App\Services\OnlinePayments;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Paying a booking online. Customers pay their own bookings by M-PESA or card;
 * dealer staff can send an M-PESA prompt to the customer's phone.
 */
class OnlinePaymentController extends Controller
{
    public function __construct(private OnlinePayments $payments) {}

    public function index(Request $request, Booking $booking): AnonymousResourceCollection
    {
        Gate::authorize('view', $booking);

        return OnlinePaymentResource::collection($booking->onlinePayments()->latest('id')->limit(20)->get());
    }

    public function mpesa(Request $request, Booking $booking): OnlinePaymentResource
    {
        $user = $request->user();
        abort_unless($user->can('payOnline', $booking) || $user->can('recordPayment', $booking), 403);
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
            'amount' => ['nullable', 'integer', 'min:1'],
        ], ['phone.required' => 'Enter the M-PESA number to send the prompt to.']);

        $payment = $this->payments->startMpesa($user, $booking, $data['phone'], $data['amount'] ?? null);

        return new OnlinePaymentResource($payment->load('booking'));
    }

    public function card(Request $request, Booking $booking): JsonResponse
    {
        Gate::authorize('payOnline', $booking);
        $data = $request->validate(['amount' => ['nullable', 'integer', 'min:1']]);

        [$payment, $url] = $this->payments->startCard($request->user(), $booking, route('payments.card.return'), $data['amount'] ?? null);

        return response()->json(['data' => (new OnlinePaymentResource($payment->load('booking')))->resolve($request), 'authorization_url' => $url]);
    }

    /** The browser polls this while the customer answers the prompt. */
    public function show(Request $request, OnlinePayment $onlinePayment): OnlinePaymentResource
    {
        Gate::authorize('view', $onlinePayment->booking);

        return new OnlinePaymentResource($this->payments->refresh($onlinePayment)->load('booking'));
    }
}
