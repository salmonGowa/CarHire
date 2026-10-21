<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Enums\VehicleStatus;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    private function dates(int $fromDays, int $toDays): array
    {
        return [
            'pickup_at' => now()->addDays($fromDays)->setTime(10, 0)->toDateTimeString(),
            'return_at' => now()->addDays($toDays)->setTime(10, 0)->toDateTimeString(),
        ];
    }

    public function test_customer_books_a_vehicle_and_server_prices_it(): void
    {
        $customer = User::factory()->create(['name' => 'Amina', 'phone' => '0700']);
        $vehicle = Vehicle::factory()->create(['daily_rate' => 5000]);

        $this->actingAs($customer)->postJson('/api/bookings', [
            'vehicle_id' => $vehicle->id, 'pickup_location' => 'Nairobi CBD', ...$this->dates(2, 5),
            'customer_name' => 'Someone Else', // ignored for customers
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.customer.name', 'Amina')
            ->assertJsonPath('data.days', 3)
            ->assertJsonPath('data.subtotal', 15000)
            ->assertJsonPath('data.vat', 2400)
            ->assertJsonPath('data.total', 17400)
            ->assertJsonPath('data.allowed_transitions', ['cancelled']);
    }

    public function test_overlapping_bookings_are_rejected(): void
    {
        $vehicle = Vehicle::factory()->create();
        Booking::factory()->for($vehicle)->create([...$this->dates(2, 5), 'status' => BookingStatus::Confirmed]);

        $this->actingAs(User::factory()->create())->postJson('/api/bookings', [
            'vehicle_id' => $vehicle->id, 'pickup_location' => 'CBD', ...$this->dates(4, 6),
        ])->assertUnprocessable()->assertJsonValidationErrors('vehicle_id');
    }

    public function test_back_to_back_and_cancelled_bookings_do_not_block(): void
    {
        $vehicle = Vehicle::factory()->create();
        Booking::factory()->for($vehicle)->create([...$this->dates(1, 3), 'status' => BookingStatus::Confirmed]);
        Booking::factory()->for($vehicle)->create([...$this->dates(3, 6), 'status' => BookingStatus::Cancelled]);

        $this->actingAs(User::factory()->create())->postJson('/api/bookings', [
            'vehicle_id' => $vehicle->id, 'pickup_location' => 'CBD', ...$this->dates(3, 5),
        ])->assertCreated();
    }

    public function test_maintenance_vehicles_cannot_be_booked(): void
    {
        $vehicle = Vehicle::factory()->maintenance()->create();

        $this->actingAs(User::factory()->create())->postJson('/api/bookings', [
            'vehicle_id' => $vehicle->id, 'pickup_location' => 'CBD', ...$this->dates(1, 2),
        ])->assertUnprocessable();
    }

    public function test_dealer_books_walk_in_client_on_own_fleet_only(): void
    {
        $dealer = Dealer::factory()->create();
        $staff = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]);
        $mine = Vehicle::factory()->for($dealer)->create();
        $theirs = Vehicle::factory()->create();
        $client = ['customer_name' => 'Walk In', 'customer_phone' => '0711', 'customer_id_number' => '12345678', 'pickup_location' => 'CBD', 'payment_method' => 'mpesa'];

        $this->actingAs($staff)->postJson('/api/bookings', ['vehicle_id' => $mine->id, ...$client, ...$this->dates(1, 2)])
            ->assertCreated()->assertJsonPath('data.status', 'confirmed')->assertJsonPath('data.customer.id', null);

        $this->actingAs($staff)->postJson('/api/bookings', ['vehicle_id' => $theirs->id, ...$client, ...$this->dates(1, 2)])
            ->assertUnprocessable()->assertJsonValidationErrors('vehicle_id');

        $this->actingAs($staff)->postJson('/api/bookings', ['vehicle_id' => $mine->id, 'pickup_location' => 'CBD', ...$this->dates(5, 6)])
            ->assertUnprocessable()->assertJsonValidationErrors(['customer_name', 'customer_phone', 'customer_id_number']);
    }

    public function test_bookings_list_is_scoped_per_role(): void
    {
        $dealer = Dealer::factory()->create();
        $customer = User::factory()->create();
        Booking::factory()->for(Vehicle::factory()->for($dealer))->create(['customer_id' => $customer->id]);
        Booking::factory()->for(Vehicle::factory()->for($dealer))->create();
        Booking::factory()->create();

        $this->actingAs($customer)->getJson('/api/bookings')->assertJsonCount(1, 'data');
        $this->actingAs(User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]))
            ->getJson('/api/bookings')->assertJsonCount(2, 'data');
        $this->actingAs(User::factory()->create(['role' => UserRole::SuperAdmin]))
            ->getJson('/api/bookings')->assertJsonCount(3, 'data');
    }

    public function test_lifecycle_updates_vehicle_status(): void
    {
        $dealer = Dealer::factory()->create();
        $staff = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]);
        $vehicle = Vehicle::factory()->for($dealer)->create();
        $booking = Booking::factory()->for($vehicle)->create(['status' => BookingStatus::Pending]);

        foreach (['confirmed', 'active'] as $status) {
            $this->actingAs($staff)->patchJson("/api/bookings/{$booking->id}/status", ['status' => $status])
                ->assertOk()->assertJsonPath('data.status', $status);
        }
        $this->assertSame(VehicleStatus::Rented, $vehicle->fresh()->status);

        $this->actingAs($staff)->patchJson("/api/bookings/{$booking->id}/status", ['status' => 'completed'])->assertOk();
        $this->assertSame(VehicleStatus::Available, $vehicle->fresh()->status);
    }

    public function test_invalid_transitions_are_rejected(): void
    {
        $booking = Booking::factory()->create(['status' => BookingStatus::Completed]);
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);

        $this->actingAs($admin)->patchJson("/api/bookings/{$booking->id}/status", ['status' => 'active'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_customer_can_only_cancel_their_own_booking(): void
    {
        $customer = User::factory()->create();
        $mine = Booking::factory()->create(['customer_id' => $customer->id, 'status' => BookingStatus::Pending]);
        $someoneElses = Booking::factory()->create(['status' => BookingStatus::Pending]);

        $this->actingAs($customer)->patchJson("/api/bookings/{$mine->id}/status", ['status' => 'confirmed'])->assertForbidden();
        $this->actingAs($customer)->patchJson("/api/bookings/{$mine->id}/status", ['status' => 'cancelled'])
            ->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->actingAs($customer)->patchJson("/api/bookings/{$someoneElses->id}/status", ['status' => 'cancelled'])->assertForbidden();
    }

    public function test_customer_rates_completed_trips_only(): void
    {
        $customer = User::factory()->create();
        $done = Booking::factory()->create(['customer_id' => $customer->id, 'status' => BookingStatus::Completed]);
        $upcoming = Booking::factory()->create(['customer_id' => $customer->id, 'status' => BookingStatus::Confirmed]);

        $this->actingAs($customer)->putJson("/api/bookings/{$done->id}/rating", ['rating' => 4])->assertOk()->assertJsonPath('data.rating', 4);
        $this->actingAs($customer)->putJson("/api/bookings/{$upcoming->id}/rating", ['rating' => 4])->assertForbidden();
    }

    public function test_stats_are_scoped(): void
    {
        $dealer = Dealer::factory()->create();
        Vehicle::factory()->count(2)->for($dealer)->create();
        Vehicle::factory()->maintenance()->for($dealer)->create();
        Vehicle::factory()->count(4)->create();

        $this->actingAs(User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]))
            ->getJson('/api/stats')
            ->assertJsonPath('vehicles.total', 3)
            ->assertJsonPath('vehicles.maintenance', 1)
            ->assertJsonMissingPath('platform');

        $this->actingAs(User::factory()->create(['role' => UserRole::SuperAdmin]))
            ->getJson('/api/stats')->assertJsonPath('vehicles.total', 7)->assertJsonPath('platform.dealers', 5);
    }

    public function test_api_requires_authentication(): void
    {
        $this->getJson('/api/bookings')->assertUnauthorized();
        $this->getJson('/api/vehicles')->assertUnauthorized();
    }
}
