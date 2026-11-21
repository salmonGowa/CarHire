<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Services\OnlinePayments;
use App\Services\Payments\CardGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Results posted by payment providers. These routes have no session or CSRF
 * check; each provider is authenticated its own way instead.
 */
class WebhookController extends Controller
{
    public function __construct(private OnlinePayments $payments) {}

    /** Daraja doesn't sign callbacks, so the URL carries a secret token only Safaricom is given. */
    public function mpesa(Request $request, string $token): JsonResponse
    {
        $expected = (string) config('services.mpesa.callback_token');
        abort_unless($expected !== '' && hash_equals($expected, $token), 404);

        $this->payments->handleMpesaCallback($request->json()->all());

        // Daraja only needs to hear that the result was received.
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /** Paystack signs the raw body with the secret key (x-paystack-signature). */
    public function paystack(Request $request, CardGateway $card): Response
    {
        abort_unless($card->verifyWebhook($request->getContent(), $request->header('x-paystack-signature')), 401);

        if (in_array($request->json('event'), ['charge.success', 'charge.failed'], true) && is_string($reference = $request->json('data.reference'))) {
            // Don't trust the body's status: check the transaction with Paystack.
            $this->payments->handleCardEvent($reference);
        }

        return response()->noContent(200);
    }
}
