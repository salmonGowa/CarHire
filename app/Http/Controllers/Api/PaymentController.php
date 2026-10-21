<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\FinanceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function __construct(private FinanceService $finance) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $payments = Payment::query()
            ->visibleTo($request->user())
            ->with(['booking.vehicle', 'invoice', 'dealer'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('reference', 'like', $term)
                    ->orWhere('transaction_code', 'like', $term)
                    ->orWhereHas('booking', fn ($b) => $b->where('customer_name', 'like', $term)->orWhere('reference', 'like', $term)));
            })
            ->orderByDesc('paid_at')
            ->paginate(min($request->integer('per_page', 50), 200));

        return PaymentResource::collection($payments);
    }

    /**
     * Record money received for a booking. Online collection (M-PESA STK push,
     * card gateway) is not connected yet, so staff enter what they received.
     */
    public function store(Request $request, Booking $booking): PaymentResource
    {
        Gate::authorize('recordPayment', $booking);

        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'transaction_code' => [
                Rule::requiredIf(fn () => in_array($request->input('method'), ['mpesa', 'bank'], true)),
                'nullable', 'string', 'max:40', 'unique:payments,transaction_code',
            ],
            'paid_at' => ['nullable', 'date', 'before_or_equal:now'],
            'notes' => ['nullable', 'string', 'max:255'],
        ], [
            'transaction_code.required' => 'Enter the M-PESA or bank transaction code.',
            'transaction_code.unique' => 'That transaction code has already been recorded.',
        ]);

        if (isset($data['transaction_code'])) {
            $data['transaction_code'] = strtoupper(trim($data['transaction_code']));
        }

        $payment = $this->finance->recordPayment($request->user(), $booking, $data);

        return new PaymentResource($payment->load(['booking.vehicle', 'invoice', 'dealer']));
    }

    public function refund(Payment $payment): PaymentResource
    {
        Gate::authorize('refund', $payment);

        return new PaymentResource($this->finance->refund($payment)->load(['booking.vehicle', 'invoice', 'dealer']));
    }
}
