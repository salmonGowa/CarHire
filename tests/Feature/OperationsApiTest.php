<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Enums\VehicleStatus;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\Driver;
use App\Models\MaintenanceTask;
use App\Models\Promotion;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OperationsApiTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dealer = Dealer::factory()->create();
        $this->staff = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id]);
    }

    private function promo(array $attrs = []): Promotion
    {
        return Promotion::create([
            'dealer_id' => $this->dealer->id, 'code' => 'SAVE20', 'type' => 'percentage', 'value' => 20,
            'max_uses' => null, 'expires_on' => now()->addMonth()->toDateString(), 'is_active' => true, ...$attrs,
        ]);
    }

    private function book(User $as, Vehicle $vehicle, array $extra = [], int $from = 1, int $to = 3)
    {
        return $this->actingAs($as)->postJson('/api/bookings', [
            'vehicle_id' => $vehicle->id, 'pickup_location' => 'CBD',
            'pickup_at' => now()->addDays($from)->setTime(10, 0)->toDateTimeString(),
            'return_at' => now()->addDays($to)->setTime(10, 0)->toDateTimeString(),
            ...$extra,
        ]);
    }

    // --- Maintenance ---------------------------------------------------------

    public function test_maintenance_lifecycle_takes_the_car_off_the_road_and_back(): void
    {
        $vehicle = Vehicle::factory()->for($this->dealer)->create();
        $id = $this->actingAs($this->staff)->postJson('/api/maintenance', [
            'vehicle_id' => $vehicle->id, 'service' => 'Brakes', 'due_date' => today()->toDateString(), 'priority' => 'high',
        ])->assertCreated()->assertJsonPath('data.status', 'scheduled')->json('data.id');

        $this->actingAs($this->staff)->patchJson("/api/maintenance/{$id}/status", ['status' => 'in_progress'])->assertOk();
        $this->assertSame(VehicleStatus::Maintenance, $vehicle->fresh()->status);
        $this->book(User::factory()->create(), $vehicle)->assertUnprocessable(); // can't be booked while in the workshop

        $this->actingAs($this->staff)->patchJson("/api/maintenance/{$id}/status", ['status' => 'completed', 'cost' => 7500])
            ->assertOk()->assertJsonPath('data.cost', 7500);
        $this->assertSame(VehicleStatus::Available, $vehicle->fresh()->status);

        $this->actingAs($this->staff)->getJson('/api/maintenance?view=history')
            ->assertJsonCount(1, 'data')->assertJsonPath('summary.cost_this_month', 7500);
    }

    public function test_cannot_start_maintenance_while_the_car_is_out(): void
    {
        $vehicle = Vehicle::factory()->for($this->dealer)->create(['status' => VehicleStatus::Rented]);
        Booking::factory()->for($vehicle)->create(['status' => BookingStatus::Active]);
        $task = MaintenanceTask::create(['dealer_id' => $this->dealer->id, 'vehicle_id' => $vehicle->id, 'service' => 'Oil', 'due_date' => today(), 'priority' => 'low', 'status' => 'scheduled']);

        $this->actingAs($this->staff)->patchJson("/api/maintenance/{$task->id}/status", ['status' => 'in_progress'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_maintenance_is_scoped_and_vehicle_must_be_own(): void
    {
        $theirs = Vehicle::factory()->create();
        MaintenanceTask::create(['dealer_id' => $theirs->dealer_id, 'vehicle_id' => $theirs->id, 'service' => 'Oil', 'due_date' => today(), 'priority' => 'low', 'status' => 'scheduled']);

        $this->actingAs($this->staff)->getJson('/api/maintenance')->assertJsonCount(0, 'data');
        $this->actingAs($this->staff)->postJson('/api/maintenance', ['vehicle_id' => $theirs->id, 'service' => 'X', 'due_date' => today()->toDateString(), 'priority' => 'low'])
            ->assertUnprocessable()->assertJsonValidationErrors('vehicle_id');
        $this->actingAs(User::factory()->create())->getJson('/api/maintenance')->assertForbidden();
    }

    // --- Promotions ----------------------------------------------------------

    public function test_promo_code_discounts_before_vat(): void
    {
        $this->promo();
        $vehicle = Vehicle::factory()->for($this->dealer)->create(['daily_rate' => 5000]);

        $this->book(User::factory()->create(), $vehicle, ['promo_code' => 'save20'])
            ->assertCreated()
            ->assertJsonPath('data.discount', 2000)   // 20% of 10,000
            ->assertJsonPath('data.subtotal', 8000)
            ->assertJsonPath('data.vat', 1280)
            ->assertJsonPath('data.total', 9280);
    }

    public function test_flat_discount_never_exceeds_the_rental(): void
    {
        $this->promo(['type' => 'flat', 'value' => 50000]);
        $vehicle = Vehicle::factory()->for($this->dealer)->create(['daily_rate' => 5000]);

        $this->book(User::factory()->create(), $vehicle, ['promo_code' => 'SAVE20'])->assertCreated()->assertJsonPath('data.total', 0);
    }

    public function test_unusable_codes_are_rejected(): void
    {
        $vehicle = Vehicle::factory()->for($this->dealer)->create();
        $customer = User::factory()->create();

        $this->book($customer, $vehicle, ['promo_code' => 'NOPE'])->assertJsonValidationErrors('promo_code');

        $p = $this->promo(['expires_on' => now()->subDay()->toDateString()]);
        $this->book($customer, $vehicle, ['promo_code' => 'SAVE20'])->assertJsonValidationErrors(['promo_code' => 'expired']);

        $p->update(['expires_on' => now()->addDay(), 'is_active' => false]);
        $this->book($customer, $vehicle, ['promo_code' => 'SAVE20'])->assertJsonValidationErrors('promo_code');

        $p->update(['is_active' => true, 'max_uses' => 1]);
        $this->book($customer, $vehicle, ['promo_code' => 'SAVE20'], 1, 2)->assertCreated();
        $this->book($customer, $vehicle, ['promo_code' => 'SAVE20'], 5, 6)->assertJsonValidationErrors(['promo_code' => 'fully redeemed']);

        // Another dealer's car can't use this dealer's code.
        $this->book($customer, Vehicle::factory()->create(), ['promo_code' => 'SAVE20'])->assertJsonValidationErrors('promo_code');
    }

    public function test_promo_check_previews_the_price(): void
    {
        $this->promo();
        $vehicle = Vehicle::factory()->for($this->dealer)->create(['daily_rate' => 5000]);

        $this->actingAs(User::factory()->create())->getJson('/api/promotions/check?'.http_build_query([
            'code' => 'save20', 'vehicle_id' => $vehicle->id,
            'pickup_at' => now()->addDay()->toDateTimeString(), 'return_at' => now()->addDays(3)->toDateTimeString(),
        ]))->assertOk()->assertJsonPath('discount', 2000)->assertJsonPath('total', 9280);
    }

    public function test_used_codes_cannot_be_deleted(): void
    {
        $p = $this->promo();
        $this->book(User::factory()->create(), Vehicle::factory()->for($this->dealer)->create(), ['promo_code' => 'SAVE20'])->assertCreated();

        $this->actingAs($this->staff)->deleteJson("/api/promotions/{$p->id}")->assertUnprocessable();
        $this->actingAs($this->staff)->getJson('/api/promotions')->assertJsonPath('data.0.used', 1);
    }

    // --- Drivers & agreements ------------------------------------------------

    public function test_chauffeur_agreement_needs_a_free_driver_then_can_be_signed(): void
    {
        $driver = Driver::create(['dealer_id' => $this->dealer->id, 'name' => 'Alex', 'phone' => '0700', 'license_class' => 'B']);
        $a = Booking::factory()->for(Vehicle::factory()->for($this->dealer))->create(['status' => BookingStatus::Confirmed, 'pickup_at' => now()->addDay(), 'return_at' => now()->addDays(3)]);
        $b = Booking::factory()->for(Vehicle::factory()->for($this->dealer))->create(['status' => BookingStatus::Confirmed, 'pickup_at' => now()->addDays(2), 'return_at' => now()->addDays(4)]);

        $this->actingAs($this->staff)->putJson("/api/bookings/{$a->id}/agreement", ['agreement_type' => 'chauffeur'])->assertJsonValidationErrors('driver_id');
        $this->actingAs($this->staff)->putJson("/api/bookings/{$a->id}/agreement", ['agreement_type' => 'chauffeur', 'driver_id' => $driver->id])
            ->assertOk()->assertJsonPath('data.driver.name', 'Alex')->assertJsonPath('data.status', 'pending_signature');
        $this->actingAs($this->staff)->putJson("/api/bookings/{$b->id}/agreement", ['agreement_type' => 'chauffeur', 'driver_id' => $driver->id])
            ->assertUnprocessable()->assertJsonValidationErrors('driver_id');

        $this->actingAs($this->staff)->postJson("/api/bookings/{$a->id}/agreement/sign")->assertOk()->assertJsonPath('data.status', 'signed');

        $a->update(['status' => BookingStatus::Active]);
        $this->actingAs($this->staff)->getJson('/api/drivers')->assertJsonPath('data.0.current_assignment.booking_reference', $a->reference);
    }

    public function test_drivers_are_scoped_to_the_dealership(): void
    {
        Driver::create(['dealer_id' => Dealer::factory()->create()->id, 'name' => 'Other', 'phone' => '0', 'license_class' => 'B']);
        $this->actingAs($this->staff)->postJson('/api/drivers', ['name' => 'Mine', 'phone' => '0711', 'license_class' => 'B'])->assertCreated();

        $this->actingAs($this->staff)->getJson('/api/drivers')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Mine');
    }

    // --- Reviews & customers -------------------------------------------------

    public function test_customer_review_and_dealer_reply(): void
    {
        $customer = User::factory()->create();
        $booking = Booking::factory()->for(Vehicle::factory()->for($this->dealer))->create(['customer_id' => $customer->id, 'status' => BookingStatus::Completed]);

        $this->actingAs($customer)->putJson("/api/bookings/{$booking->id}/rating", ['rating' => 4, 'review' => 'Great car'])->assertOk();
        $this->actingAs($this->staff)->getJson('/api/reviews')
            ->assertJsonPath('data.0.review', 'Great car')->assertJsonPath('summary.awaiting_reply', 1);

        $other = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => Dealer::factory()->create()->id]);
        $this->actingAs($other)->putJson("/api/bookings/{$booking->id}/reply", ['reply' => 'x'])->assertForbidden();

        $this->actingAs($this->staff)->putJson("/api/bookings/{$booking->id}/reply", ['reply' => 'Thank you!'])->assertOk();
        $this->actingAs($customer)->getJson("/api/bookings/{$booking->id}")->assertJsonPath('data.review_reply', 'Thank you!');
    }

    public function test_customers_are_grouped_from_bookings(): void
    {
        $account = User::factory()->create(['name' => 'Amina']);
        $vehicle = Vehicle::factory()->for($this->dealer)->create();
        Booking::factory()->for($vehicle)->count(2)->sequence(
            ['pickup_at' => now()->subDays(20), 'return_at' => now()->subDays(18)],
            ['pickup_at' => now()->subDays(10), 'return_at' => now()->subDays(8)],
        )->create(['customer_id' => $account->id, 'customer_name' => 'Amina', 'status' => BookingStatus::Completed]);
        Booking::factory()->for($vehicle)->create(['customer_name' => 'Walk In', 'customer_phone' => '0700', 'status' => BookingStatus::Cancelled]);
        Booking::factory()->create(['customer_name' => 'Someone else entirely']);

        $this->actingAs($this->staff)->getJson('/api/dealer-customers')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.repeat', 1)
            ->assertJsonFragment(['name' => 'Amina', 'completed_trips' => 2, 'has_account' => true])
            ->assertJsonFragment(['name' => 'Walk In', 'cancellations' => 1, 'trips' => 0]);
    }
}
