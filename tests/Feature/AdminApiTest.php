<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
    }

    public function test_admin_endpoints_are_super_admin_only(): void
    {
        foreach ([UserRole::Hr, UserRole::Dealer, UserRole::Customer] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->getJson('/api/admin/clients')->assertForbidden();
        }
        $this->actingAs($this->admin)->getJson('/api/admin/clients')->assertOk();
    }

    public function test_dealer_onboarding_suspension_and_deletion_rules(): void
    {
        $id = $this->actingAs($this->admin)->postJson('/api/admin/dealers', [
            'name' => 'Coastal Drives', 'city' => 'Mombasa', 'status' => 'active', 'tier' => 'silver', 'owner_name' => 'Ali',
        ])->assertCreated()->json('data.id');
        $this->actingAs($this->admin)->postJson('/api/admin/dealers', ['name' => 'Coastal Drives', 'city' => 'X', 'status' => 'active', 'tier' => 'silver'])
            ->assertJsonValidationErrors('name');

        $vehicle = Vehicle::factory()->create(['dealer_id' => $id]);
        $this->actingAs($this->admin)->putJson("/api/admin/dealers/{$id}", ['name' => 'Coastal Drives', 'city' => 'Mombasa', 'status' => 'suspended', 'tier' => 'silver'])
            ->assertOk()->assertJsonPath('data.status', 'suspended')->assertJsonPath('data.fleet_breakdown.0.count', 1);
        $this->actingAs(User::factory()->create())->getJson('/api/catalog/vehicles')->assertJsonCount(0, 'data');

        Booking::factory()->for($vehicle)->create();
        $this->actingAs($this->admin)->deleteJson("/api/admin/dealers/{$id}")->assertUnprocessable();
        $this->assertTrue(AuditLog::where('action', 'dealer.suspended')->exists());
    }

    public function test_added_staff_get_a_working_temporary_password(): void
    {
        $dealer = Dealer::factory()->create();
        $res = $this->actingAs($this->admin)->postJson("/api/admin/dealers/{$dealer->id}/staff", [
            'name' => 'New Agent', 'email' => 'agent@dealer.test', 'job_title' => 'Sales Agent',
        ])->assertCreated();
        $password = $res->json('temporary_password');
        $this->assertSame(12, strlen($password));

        auth()->guard('web')->logout();
        $this->postJson('/api/auth/login', ['email' => 'agent@dealer.test', 'password' => $password])
            ->assertOk()->assertJsonPath('user.role', 'dealer')->assertJsonPath('user.dealer.id', $dealer->id);
    }

    public function test_suspended_accounts_cannot_sign_in_and_are_signed_out(): void
    {
        $customer = User::factory()->create();
        $this->actingAs($this->admin)->patchJson("/api/admin/users/{$customer->id}/status", ['suspended' => true])->assertOk()->assertJsonPath('data.status', 'suspended');

        $this->actingAs($customer->fresh())->getJson('/api/bookings')->assertForbidden();
        auth()->guard('web')->logout();
        $this->postJson('/api/auth/login', ['email' => $customer->email, 'password' => 'password'])->assertJsonValidationErrors('email');

        $this->actingAs($this->admin)->patchJson("/api/admin/users/{$customer->id}/status", ['suspended' => false])->assertOk();
        auth()->guard('web')->logout();
        $this->postJson('/api/auth/login', ['email' => $customer->email, 'password' => 'password'])->assertOk();
    }

    public function test_admins_cannot_lock_themselves_or_the_platform_out(): void
    {
        $this->actingAs($this->admin)->patchJson("/api/admin/users/{$this->admin->id}/status", ['suspended' => true])->assertUnprocessable();

        $other = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->actingAs($this->admin)->patchJson("/api/admin/users/{$other->id}/status", ['suspended' => true])->assertOk();
        // A suspended admin is shut out before they can act.
        $this->actingAs($other->fresh())->patchJson("/api/admin/users/{$this->admin->id}/status", ['suspended' => true])->assertForbidden();
        $this->assertNull($this->admin->fresh()->disabled_at);
    }

    public function test_client_kyc_flag_and_value_metrics(): void
    {
        $client = User::factory()->create();
        $vehicle = Vehicle::factory()->create();
        $done = Booking::factory()->for($vehicle)->create(['customer_id' => $client->id, 'status' => BookingStatus::Completed, 'total' => 60000]);
        Booking::factory()->for($vehicle)->create(['customer_id' => $client->id, 'status' => BookingStatus::Cancelled, 'pickup_at' => now()->addDays(20), 'return_at' => now()->addDays(21)]);
        $invoice = Invoice::create(['number' => 'INV-T-1', 'booking_id' => $done->id, 'dealer_id' => $vehicle->dealer_id, 'customer_name' => 'x', 'issued_at' => now(), 'subtotal' => 51724, 'vat' => 8276, 'total' => 60000]);
        Payment::create(['invoice_id' => $invoice->id, 'booking_id' => $done->id, 'dealer_id' => $vehicle->dealer_id, 'customer_id' => $client->id, 'amount' => 60000, 'vat' => 8276, 'commission' => 5172, 'method' => 'cash', 'status' => PaymentStatus::Completed, 'paid_at' => now()]);

        $this->actingAs($this->admin)->getJson("/api/admin/clients/{$client->id}")
            ->assertJsonPath('data.ltv', 60000)->assertJsonPath('data.tier', 'Silver')
            ->assertJsonPath('data.completion_rate', 50)->assertJsonPath('data.kyc', 'Pending');

        $this->actingAs($this->admin)->postJson("/api/admin/clients/{$client->id}/kyc", ['decision' => 'rejected'])->assertJsonValidationErrors('note');
        $this->actingAs($this->admin)->postJson("/api/admin/clients/{$client->id}/kyc", ['decision' => 'verified'])
            ->assertJsonPath('data.kyc', 'Verified')->assertJsonPath('data.kyc_reviewer', $this->admin->name);
        $this->actingAs($this->admin)->postJson("/api/admin/clients/{$client->id}/flag", ['flagged' => true])->assertJsonPath('data.status', 'Flagged');

        $this->actingAs($this->admin)->getJson("/api/admin/clients/{$client->id}")
            ->assertJsonPath('data.activity.0.action', fn ($a) => str_contains($a, 'Flagged'));
    }

    public function test_clients_with_open_bookings_cannot_be_deleted(): void
    {
        $client = User::factory()->create();
        Booking::factory()->create(['customer_id' => $client->id, 'status' => BookingStatus::Confirmed]);

        $this->actingAs($this->admin)->deleteJson("/api/admin/clients/{$client->id}")->assertUnprocessable();
        $this->actingAs($this->admin)->deleteJson("/api/admin/clients/{$this->admin->id}")->assertNotFound(); // not a customer
    }

    public function test_staff_invites_and_audit_log_search(): void
    {
        $this->actingAs($this->admin)->postJson('/api/admin/staff', ['name' => 'Grace', 'email' => 'grace@drivefleet.ke', 'role' => 'hr', 'job_title' => 'HR Officer'])
            ->assertCreated()->assertJsonStructure(['temporary_password']);
        $this->actingAs($this->admin)->postJson('/api/admin/staff', ['name' => 'X', 'email' => 'x@drivefleet.ke', 'role' => 'customer', 'job_title' => 'X'])
            ->assertJsonValidationErrors('role');

        auth()->guard('web')->logout();
        $this->postJson('/api/auth/login', ['email' => 'nobody@x.test', 'password' => 'nope']);

        $this->actingAs($this->admin)->getJson('/api/admin/audit-logs?search=grace@drivefleet.ke')->assertJsonPath('data.0.action', 'staff.invited');
        $this->actingAs($this->admin)->getJson('/api/admin/audit-logs?severity=warning')->assertJsonPath('data.0.action', 'auth.failed');

        $csv = $this->actingAs($this->admin)->get('/api/admin/audit-logs/export?search=grace@drivefleet.ke')->assertOk()->streamedContent();
        $this->assertStringContainsString('staff.invited', $csv);
        $this->assertStringNotContainsString('auth.failed', $csv);
        $this->assertDatabaseHas('audit_logs', ['action' => 'audit.exported']);
    }
}
