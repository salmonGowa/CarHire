<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\OnlinePayment;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use App\Notifications\PlatformNotification;
use App\Services\OnlinePayments;
use App\Services\Payments\CardGateway;
use App\Services\Payments\MpesaGateway;
use App\Services\Payments\SimulatedMpesaGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OnlinePaymentsTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;

    private User $customer;

    private Booking $booking;

    protected function setUp(): void
    {
        parent::setUp();
        $dealer = Dealer::factory()->create();
        $this->manager = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id, 'dealer_role' => 'manager']);
        $this->customer = User::factory()->create(['role' => UserRole::Customer, 'email' => 'jane@example.com']);
        $vehicle = Vehicle::factory()->for($dealer)->create(['daily_rate' => 5000]);

        $id = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'vehicle_id' => $vehicle->id, 'pickup_location' => 'CBD',
            'pickup_at' => now()->addDays(3)->setTime(10, 0)->toDateTimeString(), 'return_at' => now()->addDays(5)->setTime(10, 0)->toDateTimeString(),
        ])->assertCreated()->json('data.id');
        $this->booking = Booking::find($id);
    }

    private function confirm(): void
    {
        $this->actingAs($this->manager)->patchJson("/api/bookings/{$this->booking->id}/status", ['status' => 'confirmed'])->assertOk();
        $this->booking->refresh();
    }

    private function useDaraja(): void
    {
        config(['services.mpesa.driver' => 'daraja', 'services.mpesa.callback_token' => 'secret-token', 'services.mpesa.shortcode' => '174379', 'services.mpesa.passkey' => 'pk']);
        $this->app->forgetInstance(MpesaGateway::class);
        $this->app->forgetInstance(OnlinePayments::class);
        Http::fake([
            '*/oauth/*' => Http::response(['access_token' => 't']),
            '*/processrequest' => Http::response(['ResponseCode' => '0', 'MerchantRequestID' => 'm1', 'CheckoutRequestID' => 'ws_CO_123', 'CustomerMessage' => 'ok']),
            '*/stkpushquery/*' => Http::response(['errorCode' => '500.001.1001', 'errorMessage' => 'The transaction is being processed'], 500),
        ]);
    }

    /** @return array<string, mixed> */
    private function stkResult(int $code, int $amount = 0, string $receipt = 'TKL9ABCDEF'): array
    {
        return ['Body' => ['stkCallback' => [
            'MerchantRequestID' => 'm1', 'CheckoutRequestID' => 'ws_CO_123', 'ResultCode' => $code, 'ResultDesc' => $code ? 'Request cancelled by user' : 'The service request is processed successfully.',
            ...($code === 0 ? ['CallbackMetadata' => ['Item' => [
                ['Name' => 'Amount', 'Value' => $amount], ['Name' => 'MpesaReceiptNumber', 'Value' => $receipt],
                ['Name' => 'TransactionDate', 'Value' => 20261121093005], ['Name' => 'PhoneNumber', 'Value' => 254712345678],
            ]]] : []),
        ]]];
    }

    public function test_customer_pays_the_balance_by_simulated_mpesa(): void
    {
        Notification::fake();
        $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712345678'])
            ->assertForbidden(); // not confirmed yet
        $this->confirm();
        $total = $this->booking->total;

        $id = $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712 345 678'])
            ->assertCreated()->assertJsonPath('data.status', 'pending')->assertJsonPath('data.amount', $total)
            ->assertJsonPath('data.phone', '254712***678')->assertJsonPath('data.simulated', true)->json('data.id');
        $this->getJson("/api/online-payments/{$id}")->assertJsonPath('data.status', 'pending');

        $this->travel(SimulatedMpesaGateway::APPROVE_AFTER_SECONDS + 3)->seconds();
        $this->getJson("/api/online-payments/{$id}")->assertJsonPath('data.status', 'succeeded')->assertJsonPath('data.receipt', fn ($r) => str_starts_with($r, 'SIM'));

        $payment = Payment::sole();
        $this->assertSame('mpesa', $payment->method->value);
        $this->assertSame($total, $payment->amount);
        $this->assertSame('paid', $this->booking->invoice->fresh()->status());
        $this->assertSame($payment->id, OnlinePayment::sole()->payment_id);
        Notification::assertSentTo($this->manager, PlatformNotification::class, fn ($n) => $n->title === 'Online payment received');
        Notification::assertSentTo($this->customer, PlatformNotification::class, fn ($n) => $n->title === 'Payment received');
    }

    public function test_prompts_are_validated_and_limited_to_the_booking_people(): void
    {
        $this->confirm();
        $url = "/api/bookings/{$this->booking->id}/pay/mpesa";
        $this->actingAs(User::factory()->create(['role' => UserRole::Customer]))->postJson($url, ['phone' => '0712345678'])->assertForbidden();
        $this->actingAs($this->customer)->postJson($url, ['phone' => '020 123 4567'])->assertJsonValidationErrors('phone');
        $this->actingAs($this->customer)->postJson($url, ['phone' => '0712345678', 'amount' => $this->booking->total + 1])->assertJsonValidationErrors('amount');

        // Staff can send the prompt to the customer's phone, for part of the balance.
        $this->actingAs($this->manager)->postJson($url, ['phone' => '0712345678', 'amount' => 1000])->assertCreated()->assertJsonPath('data.amount', 1000);
        // Only one live prompt per booking.
        $this->actingAs($this->customer)->postJson($url, ['phone' => '0712345678'])->assertJsonValidationErrors('phone');
        $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/card")->assertOk();
        $this->actingAs($this->manager)->postJson("/api/bookings/{$this->booking->id}/pay/card")->assertForbidden(); // card is the customer's own checkout
    }

    public function test_daraja_callback_records_the_receipt_once(): void
    {
        Notification::fake();
        $this->useDaraja();
        $this->confirm();
        $id = $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712345678', 'amount' => 3000])->assertCreated()->json('data.id');
        $this->assertSame('ws_CO_123', OnlinePayment::find($id)->checkout_id);

        $this->postJson('/webhooks/mpesa/wrong', $this->stkResult(0, 3000))->assertNotFound();
        $this->postJson('/webhooks/mpesa/secret-token', $this->stkResult(0, 3000))->assertOk()->assertJson(['ResultCode' => 0]);
        $this->postJson('/webhooks/mpesa/secret-token', $this->stkResult(0, 3000))->assertOk(); // Safaricom retries

        $payment = Payment::sole();
        $this->assertSame('TKL9ABCDEF', $payment->transaction_code);
        $this->assertSame(3000, $payment->amount);
        $this->assertSame('succeeded', OnlinePayment::find($id)->status);
        $this->assertSame(3000, $this->booking->invoice->fresh()->amount_paid);
    }

    public function test_a_cancelled_prompt_says_why_and_records_nothing(): void
    {
        $this->useDaraja();
        $this->confirm();
        $id = $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712345678'])->json('data.id');
        $this->postJson('/webhooks/mpesa/secret-token', $this->stkResult(1032))->assertOk();

        $this->actingAs($this->customer)->getJson("/api/online-payments/{$id}")->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.message', 'The M-PESA prompt was cancelled on the phone.');
        $this->assertSame(0, Payment::count());
        // A new prompt can go out straight away.
        OnlinePayment::find($id)->update(['checkout_id' => 'ws_CO_cancelled']); // the fake hands out the same id each time
        $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712345678'])->assertCreated();
    }

    public function test_unanswered_prompts_expire_and_overpayments_are_flagged(): void
    {
        Notification::fake();
        $this->useDaraja();
        $this->confirm();
        $first = $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712345678'])->json('data.id');

        $this->travel(OnlinePayment::EXPIRES_AFTER_MINUTES['mpesa'] + 1)->minutes();
        $this->assertSame(['checked' => 1, 'succeeded' => 0, 'expired' => 1], app(OnlinePayments::class)->reconcile());
        $this->assertSame('expired', OnlinePayment::find($first)->status);

        // A second prompt; staff take the full amount in cash meanwhile; then M-PESA confirms too.
        OnlinePayment::find($first)->update(['checkout_id' => 'ws_CO_expired']); // the fake hands out the same id each time
        $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712345678'])->assertCreated();
        $this->actingAs($this->manager)->postJson("/api/bookings/{$this->booking->id}/payments", ['amount' => $this->booking->total, 'method' => 'cash'])->assertCreated();
        $this->postJson('/webhooks/mpesa/secret-token', $this->stkResult(0, $this->booking->total))->assertOk();

        $this->assertSame(2, Payment::count());
        $this->assertSame($this->booking->total * 2, $this->booking->invoice->fresh()->amount_paid);
        Notification::assertSentTo($this->manager, PlatformNotification::class, fn ($n) => $n->title === 'Booking overpaid');
    }

    public function test_money_for_a_cancelled_booking_is_flagged_to_admins(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->useDaraja();
        $this->confirm();
        $id = $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712345678'])->json('data.id');
        $this->booking->update(['status' => BookingStatus::Cancelled]);

        $this->postJson('/webhooks/mpesa/secret-token', $this->stkResult(0, 1000))->assertOk();
        $this->assertSame(0, Payment::count());
        $this->assertStringContainsString("couldn't be added to the invoice", OnlinePayment::find($id)->result_desc);
        Notification::assertSentTo($admin, PlatformNotification::class, fn ($n) => $n->title === 'Online payment needs attention');
    }

    public function test_an_mpesa_code_staff_already_typed_in_is_not_counted_twice(): void
    {
        $this->useDaraja();
        $this->confirm();
        $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/mpesa", ['phone' => '0712345678', 'amount' => 2000])->assertCreated();
        $this->actingAs($this->manager)->postJson("/api/bookings/{$this->booking->id}/payments", ['amount' => 2000, 'method' => 'mpesa', 'transaction_code' => 'TKL9ABCDEF'])->assertCreated();
        $this->postJson('/webhooks/mpesa/secret-token', $this->stkResult(0, 2000))->assertOk();

        $this->assertSame(1, Payment::count());
        $this->assertSame(Payment::sole()->id, OnlinePayment::sole()->payment_id);
    }

    public function test_simulated_card_checkout_round_trip(): void
    {
        $this->confirm();
        $res = $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/card", ['amount' => 4000])->assertOk();
        $reference = OnlinePayment::sole()->reference;
        $this->assertStringEndsWith("/payments/card/simulate/{$reference}", $res->json('authorization_url'));

        $this->actingAs($this->manager)->get("/payments/card/simulate/{$reference}")->assertForbidden();
        $this->actingAs($this->customer)->get("/payments/card/simulate/{$reference}")->assertOk()->assertSee('KSh 4,000')->assertSee('no money moves');
        $this->post("/payments/card/simulate/{$reference}", ['decision' => 'pay'])->assertRedirect(route('payments.card.return', ['reference' => $reference]));
        $this->get(route('payments.card.return', ['reference' => $reference]))->assertRedirect('/customer-billing?payment='.OnlinePayment::sole()->id);

        $this->assertSame('card', Payment::sole()->method->value);
        $this->assertSame(4000, Payment::sole()->amount);
        $this->assertSame('succeeded', OnlinePayment::sole()->status);
    }

    public function test_paystack_webhook_is_verified_and_double_checked(): void
    {
        config(['services.card.driver' => 'paystack', 'services.paystack.secret_key' => 'sk_test_1']);
        $this->app->forgetInstance(CardGateway::class);
        $this->app->forgetInstance(OnlinePayments::class);
        Http::fake([
            'api.paystack.co/transaction/initialize' => Http::response(['status' => true, 'data' => ['authorization_url' => 'https://checkout.paystack.com/x', 'access_code' => 'x']]),
            'api.paystack.co/transaction/verify/*' => Http::response(['status' => true, 'data' => ['status' => 'success', 'amount' => 250000, 'id' => 4242, 'gateway_response' => 'Approved']]),
        ]);
        $this->confirm();
        $this->actingAs($this->customer)->postJson("/api/bookings/{$this->booking->id}/pay/card", ['amount' => 2500])->assertJsonPath('authorization_url', 'https://checkout.paystack.com/x');
        $this->get('/payments/card/simulate/'.OnlinePayment::sole()->reference)->assertNotFound(); // no stand-in page with a real provider

        $body = json_encode(['event' => 'charge.success', 'data' => ['reference' => OnlinePayment::sole()->reference, 'status' => 'success']]);
        $this->call('POST', '/webhooks/paystack', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => 'forged'], $body)->assertUnauthorized();
        $this->call('POST', '/webhooks/paystack', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => hash_hmac('sha512', $body, 'sk_test_1')], $body)->assertOk();

        $this->assertSame('4242', Payment::sole()->transaction_code);
        $this->assertSame(2500, Payment::sole()->amount);
    }

    public function test_integrations_page_reports_payment_providers(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $rows = fn () => collect($this->actingAs($admin)->getJson('/api/admin/integrations')->assertOk()->json('data'))->keyBy('id');

        $this->assertSame('attention', $rows()['mpesa']['status']);
        $this->assertStringContainsString('Simulated', $rows()['card']['detail']);

        config(['services.mpesa.driver' => 'daraja', 'services.mpesa.consumer_key' => 'k', 'services.mpesa.consumer_secret' => 's', 'services.mpesa.shortcode' => '174379']);
        $this->assertSame('error', $rows()['mpesa']['status']);
        $this->assertStringContainsString('MPESA_PASSKEY, MPESA_CALLBACK_TOKEN are missing', $rows()['mpesa']['detail']);

        config(['services.mpesa.passkey' => 'p', 'services.mpesa.callback_token' => 't', 'services.card.driver' => 'paystack', 'services.paystack.secret_key' => 'sk_test_1']);
        $this->assertSame('configured', $rows()['mpesa']['status']);
        $this->assertStringContainsString('No payments in the last 24 hours', $rows()['mpesa']['detail']);
        $this->assertStringContainsString('Test keys', $rows()['card']['detail']);
    }
}
