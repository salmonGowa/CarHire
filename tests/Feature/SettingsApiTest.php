<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\User;
use App\Models\Vehicle;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
    }

    private function set(array $values): void
    {
        $this->actingAs($this->admin)->putJson('/api/admin/settings', $values)->assertOk();
    }

    /** @return array<string, string> */
    private function dates(int $fromDays, int $toDays): array
    {
        return [
            'pickup_at' => now()->addDays($fromDays)->setTime(10, 0)->toDateTimeString(),
            'return_at' => now()->addDays($toDays)->setTime(10, 0)->toDateTimeString(),
        ];
    }

    public function test_settings_are_validated_saved_and_audited(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Hr]))->getJson('/api/admin/settings')->assertForbidden();
        $this->actingAs($this->admin)->getJson('/api/admin/settings')
            ->assertJsonPath('data.commission_rate', 0.1)->assertJsonPath('fixed.vat_rate', 0.16);

        $this->actingAs($this->admin)->putJson('/api/admin/settings', ['commission_rate' => 0.9])->assertJsonValidationErrors('commission_rate');
        $this->actingAs($this->admin)->putJson('/api/admin/settings', ['support_email' => 'nope'])->assertJsonValidationErrors('support_email');

        $this->set(['commission_rate' => '0.12', 'max_booking_days' => '14', 'unknown_key' => 'ignored']);
        $this->assertSame(0.12, Settings::get('commission_rate'));
        $this->assertSame(14, Settings::get('max_booking_days'));
        $log = AuditLog::where('action', 'settings.commission_rate')->sole();
        $this->assertSame('warning', $log->severity);
        $this->assertStringContainsString('0.1 to 0.12', $log->description);

        // Saving the same value again doesn't log a change.
        $this->set(['commission_rate' => 0.12]);
        $this->assertSame(1, AuditLog::where('action', 'settings.commission_rate')->count());

        // The page shell carries the public settings for the frontend.
        $this->get('/login')->assertSee('"max_booking_days":14', false)->assertDontSee('commission_rate');
    }

    public function test_commission_change_applies_to_new_payments(): void
    {
        $this->set(['commission_rate' => 0.2]);
        $dealer = User::factory()->create(['role' => UserRole::Dealer]);
        $vehicle = Vehicle::factory()->create();
        $dealer->update(['dealer_id' => $vehicle->dealer_id]);
        $booking = Booking::factory()->for($vehicle)->create(['status' => BookingStatus::Pending, 'daily_rate' => 10000, 'days' => 1, 'subtotal' => 10000, 'vat' => 1600, 'total' => 11600]);
        $this->actingAs($dealer)->patchJson("/api/bookings/{$booking->id}/status", ['status' => 'confirmed'])->assertOk();

        $this->actingAs($dealer)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 11600, 'method' => 'mpesa', 'transaction_code' => 'QWE1234567'])
            ->assertCreated();
        $this->assertSame(2000, $booking->payments()->sole()->commission);
    }

    public function test_booking_rules_bind_customers_but_not_staff(): void
    {
        $vehicle = Vehicle::factory()->create();
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $book = fn (User $u, array $extra) => $this->actingAs($u)->postJson('/api/bookings', ['vehicle_id' => $vehicle->id, 'pickup_location' => 'CBD', 'customer_name' => 'Walk in', ...$extra]);

        $this->set(['max_booking_days' => 5, 'min_booking_hours' => 6, 'min_driver_age' => 25]);

        $book($customer, $this->dates(2, 10))->assertJsonValidationErrors('return_at');
        $pickup = now()->addDays(2)->setTime(10, 0);
        $book($customer, ['pickup_at' => $pickup->toDateTimeString(), 'return_at' => $pickup->copy()->addHours(3)->toDateTimeString()])
            ->assertJsonValidationErrors('return_at');

        $young = User::factory()->create(['role' => UserRole::Customer, 'date_of_birth' => now()->subYears(22)]);
        $book($young, $this->dates(2, 4))->assertJsonValidationErrors('vehicle_id');
        $book($customer, $this->dates(2, 4))->assertCreated(); // no date of birth on file: not checked

        $staff = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $vehicle->dealer_id]);
        $book($staff, [...$this->dates(20, 40), 'customer_phone' => '0700000000', 'customer_id_number' => '12345678'])->assertCreated();
    }

    public function test_customers_cannot_cancel_inside_the_cut_off(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $soon = Booking::factory()->create(['customer_id' => $customer->id, 'status' => BookingStatus::Confirmed, ...$this->dates(0, 2), 'pickup_at' => now()->addHours(10)]);
        $later = Booking::factory()->create(['customer_id' => $customer->id, 'status' => BookingStatus::Confirmed, ...$this->dates(5, 7)]);

        $this->actingAs($customer)->getJson("/api/bookings/{$soon->id}")->assertJsonPath('data.allowed_transitions', []);
        $this->actingAs($customer)->patchJson("/api/bookings/{$soon->id}/status", ['status' => 'cancelled'])->assertForbidden();
        $this->actingAs($customer)->patchJson("/api/bookings/{$later->id}/status", ['status' => 'cancelled'])->assertOk();

        $this->set(['free_cancellation_hours' => 0]);
        $this->actingAs($customer)->patchJson("/api/bookings/{$soon->id}/status", ['status' => 'cancelled'])->assertOk();
    }

    public function test_registration_can_be_closed_per_role(): void
    {
        $this->set(['dealer_registration' => false]);
        auth()->guard('web')->logout();
        $form = fn (string $role, string $email) => ['name' => 'New', 'email' => $email, 'role' => $role, 'company' => 'Co', 'password' => 'password123', 'password_confirmation' => 'password123'];

        $this->postJson('/api/auth/register', $form('dealer', 'd@x.test'))->assertJsonValidationErrors('role');
        $this->postJson('/api/auth/register', $form('customer', 'c@x.test'))->assertCreated();
    }

    public function test_maintenance_mode_locks_out_everyone_but_super_admins(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer, 'password' => 'password']);
        $this->set(['maintenance_mode' => true, 'maintenance_message' => 'Back at 6pm']);

        $this->actingAs($customer)->getJson('/api/bookings')->assertStatus(503)->assertJsonPath('message', 'Back at 6pm');
        $this->actingAs($this->admin)->getJson('/api/bookings')->assertOk();

        auth()->guard('web')->logout();
        $this->postJson('/api/auth/login', ['email' => $customer->email, 'password' => 'password'])->assertStatus(503);
        $this->assertGuest();
        $this->get('/')->assertOk()->assertSee('"maintenance_mode":true', false);
    }

    public function test_admin_analytics_endpoints(): void
    {
        Booking::factory()->count(3)->create();
        foreach (['7d', '30d', '6m', 'ytd', 'all'] as $period) {
            $this->actingAs($this->admin)->getJson("/api/admin/reports?period={$period}")->assertOk()
                ->assertJsonStructure(['kpis' => ['grossRevenue', 'utilization'], 'series', 'topDealers', 'funnel', 'alerts']);
        }
        $this->actingAs($this->admin)->getJson('/api/admin/reports?period=decade')->assertJsonValidationErrors('period');
        $this->actingAs($this->admin)->getJson('/api/admin/overview')->assertOk()->assertJsonStructure(['top_dealers', 'attention', 'recent_dealers']);
        $this->actingAs($this->admin)->getJson('/api/admin/integrations')->assertOk()->assertJsonPath('data.0.status', 'connected');
        $this->actingAs(User::factory()->create(['role' => UserRole::Dealer]))->getJson('/api/admin/reports')->assertForbidden();
    }
}
