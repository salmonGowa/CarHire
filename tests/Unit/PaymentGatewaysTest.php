<?php

namespace Tests\Unit;

use App\Services\Payments\DarajaGateway;
use App\Services\Payments\MpesaGateway;
use App\Services\Payments\PaymentGatewayException;
use App\Services\Payments\PaystackGateway;
use App\Services\Payments\SimulatedCardGateway;
use App\Services\Payments\SimulatedMpesaGateway;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentGatewaysTest extends TestCase
{
    private function daraja(string $type = 'CustomerPayBillOnline', ?string $till = null): DarajaGateway
    {
        return new DarajaGateway('sandbox', 'ck', 'cs', '174379', 'passkey', 'https://drivefleet.test/webhooks/mpesa/tok', $type, $till);
    }

    public function test_daraja_stk_push_signs_the_request_and_caches_the_token(): void
    {
        $this->travelTo(now('Africa/Nairobi')->setDateTime(2026, 11, 21, 9, 30, 5));
        Http::fake([
            '*/oauth/v1/generate*' => Http::response(['access_token' => 'tok123', 'expires_in' => '3599']),
            '*/mpesa/stkpush/v1/processrequest' => Http::response(['MerchantRequestID' => 'm-1', 'CheckoutRequestID' => 'ws_CO_1', 'ResponseCode' => '0', 'CustomerMessage' => 'Success. Request accepted for processing']),
        ]);

        $gateway = $this->daraja();
        $result = $gateway->stkPush('254712345678', 1500, 'BKG-ABCDEF-LONGER', 'DriveFleet rental');
        $gateway->stkPush('254712345678', 10, 'X', 'Y');

        $this->assertSame(['checkout_id' => 'ws_CO_1', 'merchant_request_id' => 'm-1', 'message' => 'Success. Request accepted for processing'], $result);
        Http::assertSentCount(3); // one token, two prompts
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'processrequest')
            && $r->hasHeader('Authorization', 'Bearer tok123')
            && $r['BusinessShortCode'] === '174379'
            && $r['Timestamp'] === '20261121093005'
            && $r['Password'] === base64_encode('174379passkey20261121093005')
            && $r['PartyA'] === '254712345678' && $r['PartyB'] === '174379'
            && $r['Amount'] === 1500
            && $r['AccountReference'] === 'BKG-ABCDEF-L' // Daraja allows 12 characters
            && $r['CallBackURL'] === 'https://drivefleet.test/webhooks/mpesa/tok');
    }

    public function test_daraja_buy_goods_pays_the_till(): void
    {
        Http::fake(['*/oauth/*' => Http::response(['access_token' => 't']), '*/processrequest' => Http::response(['ResponseCode' => '0', 'CheckoutRequestID' => 'c'])]);
        $this->daraja('CustomerBuyGoodsOnline', '5551234')->stkPush('254712345678', 1, 'A', 'B');
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'processrequest') && $r['PartyB'] === '5551234' && $r['TransactionType'] === 'CustomerBuyGoodsOnline');
    }

    public function test_daraja_errors_become_gateway_exceptions(): void
    {
        Http::fake(['*/oauth/*' => Http::response(['errorMessage' => 'Invalid credentials'], 400)]);
        $this->expectException(PaymentGatewayException::class);
        $this->expectExceptionMessage('rejected the API keys');
        $this->daraja()->stkPush('254712345678', 1, 'A', 'B');
    }

    public function test_daraja_refused_prompt(): void
    {
        Http::fake([
            '*/oauth/*' => Http::response(['access_token' => 't']),
            '*/processrequest' => Http::response(['requestId' => 'r', 'errorCode' => '400.002.02', 'errorMessage' => 'Bad Request - Invalid PhoneNumber'], 400),
        ]);
        $this->expectExceptionMessage('Invalid PhoneNumber');
        $this->daraja()->stkPush('254700', 1, 'A', 'B');
    }

    public function test_daraja_query_maps_result_codes(): void
    {
        Http::fake([
            '*/oauth/*' => Http::response(['access_token' => 't']),
            '*/stkpushquery/*' => Http::sequence()
                ->push(['errorCode' => '500.001.1001', 'errorMessage' => 'The transaction is being processed'], 500)
                ->push(['ResponseCode' => '0', 'ResultCode' => '0', 'ResultDesc' => 'The service request is processed successfully.'])
                ->push(['ResponseCode' => '0', 'ResultCode' => '1032', 'ResultDesc' => 'Request cancelled by user'])
                ->push(['ResponseCode' => '0', 'ResultCode' => '1', 'ResultDesc' => 'The balance is insufficient for the transaction']),
        ]);
        $gateway = $this->daraja();
        $this->assertSame('pending', $gateway->query('ws_CO_1')['status']);
        $this->assertSame('succeeded', $gateway->query('ws_CO_1')['status']);
        $this->assertSame('cancelled', $gateway->query('ws_CO_1')['status']);
        $this->assertSame(['status' => 'failed', 'result_code' => '1', 'result_desc' => 'The balance is insufficient for the transaction', 'receipt' => null], $gateway->query('ws_CO_1'));
    }

    public function test_simulated_mpesa_approves_after_a_moment_and_can_fail_on_purpose(): void
    {
        $sim = new SimulatedMpesaGateway;
        $ok = $sim->stkPush('254712345678', 100, 'A', 'B')['checkout_id'];
        $cancelled = $sim->stkPush('254712345000', 100, 'A', 'B')['checkout_id'];
        $broke = $sim->stkPush('254712345111', 100, 'A', 'B')['checkout_id'];
        $this->assertSame('pending', $sim->query($ok)['status']);

        $this->travel(SimulatedMpesaGateway::APPROVE_AFTER_SECONDS)->seconds();
        $this->assertSame('succeeded', $sim->query($ok)['status']);
        $this->assertSame($sim->query($ok)['receipt'], $sim->query($ok)['receipt']);
        $this->assertSame('cancelled', $sim->query($cancelled)['status']);
        $this->assertSame('failed', $sim->query($broke)['status']);
        $this->assertSame('pending', $sim->query('unknown')['status']);
    }

    public function test_paystack_initialize_verify_and_webhook_signature(): void
    {
        Http::fake([
            'api.paystack.co/transaction/initialize' => Http::response(['status' => true, 'data' => ['authorization_url' => 'https://checkout.paystack.com/abc', 'access_code' => 'abc', 'reference' => 'OLP-1']]),
            'api.paystack.co/transaction/verify/OLP-1' => Http::response(['status' => true, 'data' => ['status' => 'success', 'amount' => 150000, 'id' => 987, 'gateway_response' => 'Approved']]),
            'api.paystack.co/transaction/verify/OLP-2' => Http::response(['status' => true, 'data' => ['status' => 'abandoned', 'amount' => 1000, 'id' => 5]]),
            'api.paystack.co/transaction/verify/NOPE' => Http::response(['status' => false, 'message' => 'Transaction reference not found'], 400),
        ]);
        $gateway = new PaystackGateway('sk_test_x');

        $this->assertSame(['authorization_url' => 'https://checkout.paystack.com/abc', 'checkout_id' => 'abc'], $gateway->initialize('OLP-1', 1500, 'jane@example.com', 'https://drivefleet.test/back'));
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), 'initialize') && $r['amount'] === 150000 && $r['currency'] === 'KES'
            && $r['reference'] === 'OLP-1' && $r['callback_url'] === 'https://drivefleet.test/back' && $r->hasHeader('Authorization', 'Bearer sk_test_x'));

        $this->assertSame(['status' => 'succeeded', 'amount' => 1500, 'receipt' => '987', 'result_desc' => 'Approved'], $gateway->verify('OLP-1'));
        $this->assertSame('cancelled', $gateway->verify('OLP-2')['status']);
        $this->assertSame('pending', $gateway->verify('NOPE')['status']);

        $body = '{"event":"charge.success","data":{"reference":"OLP-1"}}';
        $this->assertTrue($gateway->verifyWebhook($body, hash_hmac('sha512', $body, 'sk_test_x')));
        $this->assertFalse($gateway->verifyWebhook($body, hash_hmac('sha512', $body, 'other')));
        $this->assertFalse($gateway->verifyWebhook($body, null));
    }

    public function test_paystack_refusal(): void
    {
        Http::fake(['api.paystack.co/*' => Http::response(['status' => false, 'message' => 'Invalid key'], 401)]);
        $this->expectExceptionMessage('Paystack refused the checkout: Invalid key');
        (new PaystackGateway('bad'))->initialize('R', 1, 'a@b.c', 'https://x');
    }

    public function test_simulated_card_checkout(): void
    {
        $sim = new SimulatedCardGateway;
        $this->assertStringEndsWith('/payments/card/simulate/OLP-9', $sim->initialize('OLP-9', 500, 'a@b.c', 'https://back')['authorization_url']);
        $this->assertSame('pending', $sim->verify('OLP-9')['status']);
        SimulatedCardGateway::choose('OLP-9', true);
        $this->assertSame(['status' => 'succeeded', 'amount' => 500], array_intersect_key($sim->verify('OLP-9'), ['status' => 0, 'amount' => 0]));
        $this->assertSame('https://back', SimulatedCardGateway::returnUrl('OLP-9'));
    }

    public function test_drivers_follow_configuration(): void
    {
        $this->assertInstanceOf(SimulatedMpesaGateway::class, app(MpesaGateway::class));
        config(['services.mpesa.driver' => 'daraja']);
        $this->app->forgetInstance(MpesaGateway::class);
        $this->assertInstanceOf(DarajaGateway::class, app(MpesaGateway::class));
    }
}
