<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Models\OnlinePayment;
use App\Services\OnlinePayments;
use App\Services\Payments\SimulatedCardGateway;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Where the card provider sends the customer back, and (in development) a
 * stand-in for the provider's checkout page.
 */
class CardCheckoutController extends Controller
{
    public function __construct(private OnlinePayments $payments) {}

    /** Paystack appends ?reference=…&trxref=… to the callback URL. */
    public function back(Request $request): RedirectResponse
    {
        $reference = (string) ($request->query('reference') ?? $request->query('trxref'));
        $payment = $reference !== '' ? $this->payments->handleCardEvent($reference) : null;

        return redirect('/customer-billing'.($payment ? '?payment='.$payment->id : ''));
    }

    public function simulate(Request $request, string $reference): View
    {
        $payment = $this->simulated($request, $reference);

        return view('payments.simulated-card', ['payment' => $payment->load('booking')]);
    }

    public function decide(Request $request, string $reference): RedirectResponse
    {
        $this->simulated($request, $reference);
        SimulatedCardGateway::choose($reference, $request->input('decision') === 'pay');

        return redirect()->route('payments.card.return', ['reference' => $reference]);
    }

    private function simulated(Request $request, string $reference): OnlinePayment
    {
        abort_unless(config('services.card.driver') !== 'paystack', 404);
        $payment = OnlinePayment::where('reference', $reference)->where('provider', 'card')->firstOrFail();
        abort_unless($payment->initiated_by === $request->user()->id, 403);

        return $payment;
    }
}
