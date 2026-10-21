<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleApiTest extends TestCase
{
    use RefreshDatabase;

    private function dealerUser(Dealer $dealer): User
    {
        return User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'model' => 'Toyota Axio', 'plate' => 'kdx 123y', 'type' => 'Sedan', 'seats' => 5,
            'transmission' => 'auto', 'fuel_type' => 'petrol', 'daily_rate' => 4500, 'status' => 'available',
            ...$overrides,
        ];
    }

    public function test_dealer_only_sees_their_own_fleet(): void
    {
        $mine = Dealer::factory()->create();
        Vehicle::factory()->count(2)->for($mine)->create();
        Vehicle::factory()->count(3)->create();

        $this->actingAs($this->dealerUser($mine))->getJson('/api/vehicles')
            ->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_super_admin_sees_every_vehicle(): void
    {
        Vehicle::factory()->count(3)->create();
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);

        $this->actingAs($admin)->getJson('/api/vehicles')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_customers_cannot_manage_fleet(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)->getJson('/api/vehicles')->assertForbidden();
        $this->actingAs($customer)->postJson('/api/vehicles', $this->payload())->assertForbidden();
    }

    public function test_dealer_adds_vehicle_to_their_own_dealership(): void
    {
        $mine = Dealer::factory()->create();
        $other = Dealer::factory()->create();

        $this->actingAs($this->dealerUser($mine))
            ->postJson('/api/vehicles', $this->payload(['dealer_id' => $other->id]))
            ->assertCreated()
            ->assertJsonPath('data.plate', 'KDX 123Y')
            ->assertJsonPath('data.dealer.id', $mine->id);
    }

    public function test_plates_must_be_unique(): void
    {
        $dealer = Dealer::factory()->create();
        Vehicle::factory()->for($dealer)->create(['plate' => 'KDX 123Y']);

        $this->actingAs($this->dealerUser($dealer))->postJson('/api/vehicles', $this->payload())
            ->assertUnprocessable()->assertJsonValidationErrors('plate');
    }

    public function test_dealer_cannot_edit_another_dealers_vehicle(): void
    {
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($this->dealerUser(Dealer::factory()->create()))
            ->putJson("/api/vehicles/{$vehicle->id}", $this->payload())
            ->assertForbidden();
    }

    public function test_vehicle_with_active_bookings_cannot_be_deleted(): void
    {
        $dealer = Dealer::factory()->create();
        $vehicle = Vehicle::factory()->for($dealer)->create();
        Booking::factory()->for($vehicle)->create(['status' => BookingStatus::Confirmed]);

        $this->actingAs($this->dealerUser($dealer))->deleteJson("/api/vehicles/{$vehicle->id}")->assertUnprocessable();

        Booking::query()->update(['status' => BookingStatus::Completed]);
        $this->actingAs($this->dealerUser($dealer))->deleteJson("/api/vehicles/{$vehicle->id}")->assertNoContent();
        $this->assertSoftDeleted($vehicle);
    }

    public function test_catalog_hides_maintenance_and_suspended_dealers(): void
    {
        Vehicle::factory()->create(['model' => 'Visible']);
        Vehicle::factory()->maintenance()->create(['model' => 'In Workshop']);
        Vehicle::factory()->for(Dealer::factory()->suspended())->create(['model' => 'Suspended Dealer']);

        $this->actingAs(User::factory()->create())->getJson('/api/catalog/vehicles')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.model', 'Visible');
    }

    public function test_catalog_date_filter_excludes_booked_vehicles(): void
    {
        $free = Vehicle::factory()->create(['model' => 'Free']);
        $busy = Vehicle::factory()->create(['model' => 'Busy']);
        Booking::factory()->for($busy)->create([
            'pickup_at' => now()->addDays(2), 'return_at' => now()->addDays(4), 'status' => BookingStatus::Confirmed,
        ]);

        $this->actingAs(User::factory()->create())
            ->getJson('/api/catalog/vehicles?from='.now()->addDays(3)->toDateString().'&to='.now()->addDays(5)->toDateString())
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $free->id);
    }

    public function test_customer_saves_and_unsaves_vehicles(): void
    {
        $customer = User::factory()->create();
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($customer)->putJson("/api/saved-vehicles/{$vehicle->id}")->assertNoContent();
        $this->actingAs($customer)->getJson('/api/saved-vehicles')->assertJsonCount(1, 'data');
        $this->actingAs($customer)->getJson('/api/catalog/vehicles')->assertJsonPath('data.0.is_saved', true);

        $this->actingAs($customer)->deleteJson("/api/saved-vehicles/{$vehicle->id}")->assertNoContent();
        $this->actingAs($customer)->getJson('/api/saved-vehicles')->assertJsonCount(0, 'data');
    }
}
