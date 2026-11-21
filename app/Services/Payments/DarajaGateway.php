<?php

namespace App\Services\Payments;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Safaricom Daraja: OAuth, STK push and STK push query.
 *
 * @see https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 */
class DarajaGateway implements MpesaGateway
{
    public function __construct(
        private string $environment,
        private string $consumerKey,
        private string $consumerSecret,
        private string $shortcode,
        private string $passkey,
        private string $callbackUrl,
        private string $transactionType = 'CustomerPayBillOnline',
        private ?string $tillNumber = null,
    ) {}

    public function name(): string
    {
        return 'daraja';
    }

    public function stkPush(string $phone, int $amount, string $accountReference, string $description): array
    {
        $timestamp = now('Africa/Nairobi')->format('YmdHis');
        $response = $this->post('/mpesa/stkpush/v1/processrequest', [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $this->password($timestamp),
            'Timestamp' => $timestamp,
            'TransactionType' => $this->transactionType,
            'Amount' => $amount,
            'PartyA' => $phone,
            // Buy Goods prompts pay the till, which differs from the store number used to sign.
            'PartyB' => $this->transactionType === 'CustomerBuyGoodsOnline' && $this->tillNumber ? $this->tillNumber : $this->shortcode,
            'PhoneNumber' => $phone,
            'CallBackURL' => $this->callbackUrl,
            'AccountReference' => mb_substr($accountReference, 0, 12),
            'TransactionDesc' => mb_substr($description, 0, 13),
        ]);

        if ($response->json('ResponseCode') !== '0' || ! $response->json('CheckoutRequestID')) {
            throw new PaymentGatewayException('M-PESA refused the request: '.($response->json('errorMessage') ?? $response->json('ResponseDescription') ?? 'HTTP '.$response->status()));
        }

        return [
            'checkout_id' => $response->json('CheckoutRequestID'),
            'merchant_request_id' => $response->json('MerchantRequestID'),
            'message' => $response->json('CustomerMessage') ?? 'Check your phone to approve the payment.',
        ];
    }

    public function query(string $checkoutId): array
    {
        $timestamp = now('Africa/Nairobi')->format('YmdHis');
        $response = $this->post('/mpesa/stkpushquery/v1/query', [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $this->password($timestamp),
            'Timestamp' => $timestamp,
            'CheckoutRequestID' => $checkoutId,
        ]);

        // While the customer is still looking at the prompt Daraja answers with an error body.
        $code = $response->json('ResultCode');
        if ($code === null) {
            return ['status' => 'pending', 'result_code' => null, 'result_desc' => $response->json('errorMessage'), 'receipt' => null];
        }

        // The query response doesn't carry the receipt number; only the callback does.
        return ['status' => MpesaResult::status($code), 'result_code' => (string) $code, 'result_desc' => $response->json('ResultDesc'), 'receipt' => null];
    }

    private function password(string $timestamp): string
    {
        return base64_encode($this->shortcode.$this->passkey.$timestamp);
    }

    private function baseUrl(): string
    {
        return $this->environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    }

    private function token(): string
    {
        $key = 'mpesa.token.'.md5($this->environment.$this->consumerKey);

        return Cache::remember($key, now()->addMinutes(50), function () {
            try {
                $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)->timeout(15)
                    ->get($this->baseUrl().'/oauth/v1/generate', ['grant_type' => 'client_credentials']);
            } catch (ConnectionException $e) {
                throw new PaymentGatewayException("Couldn't reach M-PESA: {$e->getMessage()}");
            }
            if (! $response->successful() || ! $response->json('access_token')) {
                throw new PaymentGatewayException('M-PESA rejected the API keys (check MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET).');
            }

            return $response->json('access_token');
        });
    }

    /** @param  array<string, mixed>  $body */
    private function post(string $path, array $body): Response
    {
        try {
            return $this->client()->post($this->baseUrl().$path, $body);
        } catch (ConnectionException $e) {
            throw new PaymentGatewayException("Couldn't reach M-PESA: {$e->getMessage()}");
        }
    }

    private function client(): PendingRequest
    {
        return Http::withToken($this->token())->acceptJson()->timeout(30);
    }
}
