<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\DealerDocument;
use App\Models\SubscriptionCharge;
use App\Models\SubscriptionPlan;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PlatformApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Dealer $dealer;

    private User $dealerUser;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->dealer = Dealer::factory()->create();
        $this->dealerUser = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id]);
    }

    public function test_compliance_request_upload_review_cycle(): void
    {
        $this->actingAs($this->admin)->getJson('/api/admin/compliance')->assertOk()
            ->assertJsonPath('summary.compliance_rate', 0)
            ->assertJsonCount(count(DealerDocument::REQUIRED), 'gaps.0.missing');

        $id = $this->actingAs($this->admin)->postJson('/api/admin/compliance', [
            'dealer_id' => $this->dealer->id, 'type' => 'County Business Permit', 'due_on' => today()->addWeek()->toDateString(),
        ])->assertCreated()->assertJsonPath('data.state', 'requested')->json('data.id');
        $this->actingAs($this->admin)->postJson('/api/admin/compliance', ['dealer_id' => $this->dealer->id, 'type' => 'County Business Permit'])
            ->assertUnprocessable();

        // The dealer sees the request and uploads it; other dealers can't touch it.
        $this->actingAs($this->dealerUser)->getJson('/api/dealer-documents')->assertJsonPath('data.0.id', $id);
        $other = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => Dealer::factory()->create()->id]);
        $file = UploadedFile::fake()->create('permit.pdf', 200, 'application/pdf');
        $this->actingAs($other)->post("/api/dealer-documents/{$id}/file", ['file' => $file], ['Accept' => 'application/json'])->assertNotFound();
        $this->actingAs($this->dealerUser)->post("/api/dealer-documents/{$id}/file", ['file' => $file], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.state', 'pending_review');

        $this->actingAs($this->admin)->postJson("/api/admin/compliance/{$id}/review", ['decision' => 'rejected'])->assertJsonValidationErrors('note');
        $this->actingAs($this->admin)->postJson("/api/admin/compliance/{$id}/review", ['decision' => 'verified', 'expires_on' => today()->addDays(10)->toDateString()])
            ->assertOk()->assertJsonPath('data.state', 'expiring');
        $this->actingAs($this->admin)->get("/api/admin/compliance/{$id}/file")->assertOk();

        // A verified renewal replaces the old copy.
        $renewal = $this->actingAs($this->dealerUser)->post('/api/dealer-documents', [
            'type' => 'County Business Permit', 'file' => UploadedFile::fake()->create('permit-2027.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated()->json('data.id');
        $this->actingAs($this->admin)->postJson("/api/admin/compliance/{$renewal}/review", ['decision' => 'verified', 'expires_on' => today()->addYear()->toDateString()]);
        $this->assertSame('superseded', DealerDocument::find($id)->status);
    }

    public function test_support_ticket_visibility_and_flow(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $stranger = User::factory()->create(['role' => UserRole::Customer]);
        $booking = Booking::factory()->create(['customer_id' => $customer->id]);

        $this->actingAs($stranger)->postJson('/api/support-tickets', [
            'subject' => 'x', 'category' => 'Booking', 'body' => 'x', 'booking_id' => $booking->id,
        ])->assertUnprocessable();

        $id = $this->actingAs($customer)->postJson('/api/support-tickets', [
            'subject' => 'Flat tyre', 'category' => 'Roadside Assistance', 'priority' => 'low', 'body' => 'Help', 'booking_id' => $booking->id,
        ])->assertCreated()->assertJsonPath('data.priority', 'urgent')->assertJsonPath('data.origin', 'customer')->json('data.id');

        $this->actingAs($stranger)->getJson("/api/support-tickets/{$id}")->assertNotFound();
        $this->actingAs($this->dealerUser)->getJson('/api/support-tickets')->assertJsonCount(0, 'data');

        $this->actingAs($this->admin)->postJson("/api/support-tickets/{$id}/messages", ['body' => 'Check the claim history', 'internal' => true])
            ->assertJsonPath('data.status', 'open');
        $this->actingAs($this->admin)->postJson("/api/support-tickets/{$id}/messages", ['body' => 'A mechanic is on the way'])
            ->assertJsonPath('data.status', 'in_progress');
        $this->assertNotNull(SupportTicket::find($id)->first_response_at);

        // The customer never sees internal notes, and can only close, not reassign.
        $this->actingAs($customer)->getJson("/api/support-tickets/{$id}")->assertJsonCount(2, 'data.messages');
        $this->actingAs($customer)->patchJson("/api/support-tickets/{$id}", ['status' => 'in_progress'])->assertJsonValidationErrors('status');
        $this->actingAs($customer)->patchJson("/api/support-tickets/{$id}", ['status' => 'resolved'])->assertJsonPath('data.status', 'resolved');
        $this->actingAs($customer)->postJson("/api/support-tickets/{$id}/messages", ['body' => 'Actually it is flat again'])
            ->assertJsonPath('data.status', 'open');

        // Dealer staff see their dealership's tickets.
        $colleague = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id]);
        $this->actingAs($colleague)->postJson('/api/support-tickets', ['subject' => 'Payout', 'category' => 'Payouts', 'body' => 'Where?'])
            ->assertJsonPath('data.origin', 'dealer');
        $this->actingAs($this->dealerUser)->getJson('/api/support-tickets')->assertJsonCount(1, 'data');
        $this->actingAs($this->admin)->getJson('/api/support-tickets?status=active&origin=dealer')->assertJsonCount(1, 'data')
            ->assertJsonPath('summary.urgent_high', 1);
    }

    public function test_subscription_billing_and_plan_limits(): void
    {
        $starter = SubscriptionPlan::create(['name' => 'Starter', 'monthly_fee' => 3000, 'vehicle_limit' => 2, 'staff_limit' => 1]);
        Vehicle::factory()->count(3)->for($this->dealer)->create();

        $this->actingAs($this->admin)->putJson("/api/admin/dealers/{$this->dealer->id}/plan", ['subscription_plan_id' => $starter->id])
            ->assertUnprocessable();
        $starter->update(['vehicle_limit' => 3]);
        $this->actingAs($this->admin)->putJson("/api/admin/dealers/{$this->dealer->id}/plan", ['subscription_plan_id' => $starter->id])->assertOk();

        // At the limit: no more vehicles or staff.
        $this->actingAs($this->dealerUser)->postJson('/api/vehicles', [
            'model' => 'Toyota Axio', 'plate' => 'kdx 123y', 'type' => 'Sedan', 'seats' => 5,
            'transmission' => 'auto', 'fuel_type' => 'petrol', 'daily_rate' => 4500, 'status' => 'available',
        ])->assertUnprocessable();
        $this->actingAs($this->admin)->postJson("/api/admin/dealers/{$this->dealer->id}/staff", ['name' => 'A', 'email' => 'a@x.test', 'job_title' => 'Agent'])
            ->assertUnprocessable();

        $this->actingAs($this->admin)->postJson('/api/admin/subscription-charges/issue')->assertJsonPath('created', 1);
        $this->actingAs($this->admin)->postJson('/api/admin/subscription-charges/issue')->assertJsonPath('created', 0);
        $this->actingAs($this->admin)->postJson('/api/admin/subscription-charges/issue', ['month' => today()->addMonth()->format('Y-m')])->assertUnprocessable();

        $charge = SubscriptionCharge::sole();
        $this->actingAs($this->admin)->getJson('/api/admin/subscriptions')
            ->assertJsonPath('summary.mrr', 3000)->assertJsonPath('summary.unbilled_this_month', 0);
        $this->actingAs($this->admin)->postJson("/api/admin/subscription-charges/{$charge->id}/pay", ['method' => 'mpesa', 'transaction_ref' => 'QWE123'])
            ->assertJsonPath('data.status', 'paid');
        $this->actingAs($this->admin)->postJson("/api/admin/subscription-charges/{$charge->id}/pay", ['method' => 'mpesa'])->assertUnprocessable();
        $this->actingAs($this->admin)->postJson("/api/admin/subscription-charges/{$charge->id}/void")->assertUnprocessable();

        $this->actingAs($this->dealerUser)->getJson('/api/subscription')
            ->assertJsonPath('plan.name', 'Starter')->assertJsonPath('usage.vehicles', 3)->assertJsonPath('charges.0.status', 'paid');
        $this->actingAs($this->dealerUser)->getJson('/api/admin/subscriptions')->assertForbidden();
    }
}
