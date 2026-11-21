<?php

namespace App\Services\Payments;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Paystack hosted checkout (cards, plus whatever else the merchant enables).
 * Amounts go to Paystack in the currency's subunit (cents), so KSh 100 = 10000.
 *
 * @see https://paystack.com/docs/payments/accept-payments/
 */
class PaystackGateway implements CardGateway
{
    private const BASE = 'https://api.paystack.co';

    public function __construct(private string $secretKey, private string $currency = 'KES') {}

    public function name(): string
    {
        return 'paystack';
    }

    public function initialize(string $reference, int $amount, string $email, string $returnUrl): array
    {
        $response = $this->send('post', '/transaction/initialize', [
            'reference' => $reference,
            'amount' => $amount * 100,
            'currency' => $this->currency,
            'email' => $email,
            'callback_url' => $returnUrl,
            'channels' => ['card'],
            'metadata' => ['source' => 'drivefleet'],
        ]);
        if (! $response->json('status') || ! $response->json('data.authorization_url')) {
            throw new PaymentGatewayException('Paystack refused the checkout: '.($response->json('message') ?? 'HTTP '.$response->status()));
        }

        return ['authorization_url' => $response->json('data.authorization_url'), 'checkout_id' => $response->json('data.access_code')];
    }

    public function verify(string $reference): array
    {
        $response = $this->send('get', '/transaction/verify/'.rawurlencode($reference));
        if (! $response->json('status')) {
            // Unknown reference: the customer never reached the checkout.
            return ['status' => 'pending', 'amount' => null, 'receipt' => null, 'result_desc' => $response->json('message')];
        }
        $status = match ($response->json('data.status')) {
            'success' => 'succeeded',
            'failed', 'reversed' => 'failed',
            'abandoned' => 'cancelled',
            default => 'pending', // ongoing, pending, processing, queued
        };

        return [
            'status' => $status,
            'amount' => is_numeric($response->json('data.amount')) ? intdiv((int) $response->json('data.amount'), 100) : null,
            'receipt' => $response->json('data.id') !== null ? (string) $response->json('data.id') : null,
            'result_desc' => $response->json('data.gateway_response'),
        ];
    }

    public function verifyWebhook(string $payload, ?string $signature): bool
    {
        return $signature !== null && hash_equals(hash_hmac('sha512', $payload, $this->secretKey), $signature);
    }

    /** @param  array<string, mixed>  $body */
    private function send(string $method, string $path, array $body = []): Response
    {
        try {
            return Http::withToken($this->secretKey)->acceptJson()->timeout(30)->{$method}(self::BASE.$path, $body);
        } catch (ConnectionException $e) {
            throw new PaymentGatewayException("Couldn't reach Paystack: {$e->getMessage()}");
        }
    }
}
