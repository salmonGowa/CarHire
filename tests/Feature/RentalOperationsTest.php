<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Enums\VehicleStatus;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use App\Notifications\PlatformNotification;
use App\Services\BookingReminders;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RentalOperationsTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;

    private User $manager;

    private User $customer;

    private Vehicle $vehicle;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->dealer = Dealer::factory()->create(['deposit_amount' => 10000, 'late_grace_minutes' => 60, 'late_fee_percent' => 10, 'fuel_charge_per_percent' => 150, 'included_km_per_day' => 200, 'extra_km_rate' => 20]);
        $this->manager = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id, 'dealer_role' => 'manager']);
        $this->customer = User::factory()->create(['role' => UserRole::Customer]);
        $this->vehicle = Vehicle::factory()->for($this->dealer)->create(['daily_rate' => 5000, 'mileage' => 10000]);
    }

    /** A confirmed 2-day booking (invoice issued) from tomorrow 10:00. */
    private function confirmedBooking(): Booking
    {
        $id = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'vehicle_id' => $this->vehicle->id, 'pickup_location' => 'CBD',
            'pickup_at' => now()->addDays(3)->setTime(10, 0)->toDateTimeString(), 'return_at' => now()->addDays(5)->setTime(10, 0)->toDateTimeString(),
        ])->assertCreated()->assertJsonPath('data.deposit.amount', 10000)->json('data.id');
        $this->actingAs($this->manager)->patchJson("/api/bookings/{$id}/status", ['status' => 'confirmed'])->assertOk();

        return Booking::find($id);
    }

    private function handover(Booking $b, array $extra = [])
    {
        return $this->actingAs($this->manager)->post("/api/bookings/{$b->id}/handover", [
            'odometer' => 10000, 'fuel_level' => 80, 'deposit_received' => 10000, 'deposit_method' => 'mpesa', 'deposit_reference' => 'DEP123',
            'photos' => [UploadedFile::fake()->image('front.jpg')], ...$extra,
        ], ['Accept' => 'application/json']);
    }

    public function test_dealer_policy_is_visible_to_staff_and_editable_by_managers(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id, 'dealer_role' => 'staff']);
        $this->actingAs($staff)->getJson('/api/dealer-policy')->assertJsonPath('data.deposit_amount', 10000)->assertJsonPath('can_edit', false);
        $this->actingAs($staff)->putJson('/api/dealer-policy', [])->assertForbidden();

        $policy = ['deposit_amount' => 15000, 'late_grace_minutes' => 30, 'late_fee_percent' => 15, 'fuel_charge_per_percent' => 200, 'included_km_per_day' => null, 'extra_km_rate' => 25];
        $this->actingAs($this->manager)->putJson('/api/dealer-policy', [...$policy, 'late_fee_percent' => 101])->assertJsonValidationErrors('late_fee_percent');
        $this->actingAs($this->manager)->putJson('/api/dealer-policy', $policy)->assertJsonPath('data.deposit_amount', 15000);

        // Customers see it in the catalogue before booking.
        $this->actingAs($this->customer)->getJson('/api/catalog/vehicles')->assertJsonPath('data.0.dealer.policy.deposit_amount', 15000);
    }

    public function test_handover_records_condition_and_deposit(): void
    {
        $booking = $this->confirmedBooking();
        $this->handover($booking, ['deposit_method' => null])->assertJsonValidationErrors('deposit_method');
        $this->handover($booking)->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.deposit.held', 10000)
            ->assertJsonPath('data.inspections.pickup.fuel_level', 80)
            ->assertJsonPath('data.inspections.pickup.photos', 1);
        $this->assertSame(VehicleStatus::Rented, $this->vehicle->fresh()->status);

        $inspection = $booking->inspections()->sole();
        $this->actingAs($this->customer)->get("/api/inspections/{$inspection->id}/photos/0")->assertOk();
        $this->actingAs(User::factory()->create(['role' => UserRole::Customer]))->get("/api/inspections/{$inspection->id}/photos/0")->assertForbidden();
        $this->handover($booking->fresh())->assertJsonValidationErrors('booking');
    }

    public function test_return_charges_late_fuel_mileage_and_damage_then_settles_the_deposit(): void
    {
        $booking = $this->confirmedBooking();
        $this->handover($booking)->assertOk();
        $this->travelTo($booking->return_at->copy()->addMinutes(60 + 150)); // 2.5 h past grace → 3 started hours

        $quote = $this->actingAs($this->manager)->getJson("/api/bookings/{$booking->id}/return-quote?odometer=10600&fuel_level=60")->assertOk()->json('data');
        $byType = collect($quote['charges'])->keyBy('type');
        $this->assertSame(1500, $byType['late']['amount']);   // 3 h × 10% of 5,000
        $this->assertSame(3000, $byType['fuel']['amount']);   // 20% × 150
        $this->assertSame(4000, $byType['mileage']['amount']); // 600 km − 2 days × 200 = 200 km × 20
        $this->assertSame(10000, $quote['deposit_held']);

        $this->actingAs($this->manager)->post("/api/bookings/{$booking->id}/return", [
            'odometer' => 9000, 'fuel_level' => 60,
        ], ['Accept' => 'application/json'])->assertJsonValidationErrors('odometer');

        $res = $this->actingAs($this->manager)->post("/api/bookings/{$booking->id}/return", [
            'odometer' => 10600, 'fuel_level' => 60, 'damage_amount' => 2000, 'damage_description' => 'Scratched bumper',
        ], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('data.status', 'completed');

        $chargesTotal = (int) round((1500 + 3000 + 4000 + 2000) * 1.16);
        $this->assertSame($chargesTotal, collect($res->json('data.charges'))->sum('total'));
        $invoice = $booking->fresh()->invoice;
        $this->assertSame($booking->total + $chargesTotal, $invoice->total);
        // The whole deposit covers part of what's owed (rental unpaid + charges), so nothing is refunded.
        $this->assertSame(10000, $booking->fresh()->deposit_applied);
        $this->assertSame(0, $booking->fresh()->deposit_refunded);
        $this->assertSame('deposit', Payment::sole()->method->value);
        $this->actingAs($this->manager)->postJson('/api/payments/'.Payment::sole()->id.'/refund', ['refund_method' => 'cash'])->assertForbidden();
        $this->actingAs($this->customer)->getJson("/api/invoices/{$invoice->id}")
            ->assertJsonCount(4, 'data.booking.charges')->assertJsonPath('data.booking.charges.3.description', 'Damage: Scratched bumper');
        $this->assertSame(VehicleStatus::Available, $this->vehicle->fresh()->status);
        $this->assertSame(10600, $this->vehicle->fresh()->mileage);
    }

    public function test_deposit_can_be_held_and_settled_later_with_the_refund_recorded(): void
    {
        $booking = $this->confirmedBooking();
        $this->actingAs($this->manager)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => $booking->total, 'method' => 'cash'])->assertCreated();
        $this->handover($booking)->assertOk();
        $this->actingAs($this->manager)->post("/api/bookings/{$booking->id}/return", [
            'odometer' => 10100, 'fuel_level' => 80, 'settle_deposit' => '0',
        ], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('data.deposit.held', 10000);

        $this->actingAs($this->manager)->postJson("/api/bookings/{$booking->id}/deposit/settle", [])->assertJsonValidationErrors('refund_method');
        $this->actingAs($this->manager)->postJson("/api/bookings/{$booking->id}/deposit/settle", ['refund_method' => 'mpesa', 'refund_reference' => 'RF9'])
            ->assertOk()->assertJsonPath('data.deposit.refunded', 10000)->assertJsonPath('data.deposit.held', 0);
        $this->assertSame('mpesa', $booking->fresh()->deposit_refund_method);
    }

    public function test_extension_request_and_decision(): void
    {
        Notification::fake();
        $booking = $this->confirmedBooking();
        $newReturn = $booking->return_at->copy()->addDays(2);

        $this->actingAs(User::factory()->create(['role' => UserRole::Customer]))->postJson("/api/bookings/{$booking->id}/extensions", ['return_at' => $newReturn])->assertForbidden();
        $this->actingAs($this->customer)->postJson("/api/bookings/{$booking->id}/extensions", ['return_at' => $booking->return_at->copy()->subHour()])->assertJsonValidationErrors('return_at');

        // Someone else has the car right after.
        $other = Booking::factory()->for($this->vehicle)->create(['status' => BookingStatus::Confirmed, 'pickup_at' => $booking->return_at->copy()->addDay(), 'return_at' => $booking->return_at->copy()->addDays(4)]);
        $this->actingAs($this->customer)->postJson("/api/bookings/{$booking->id}/extensions", ['return_at' => $newReturn])->assertJsonValidationErrors('return_at');
        $other->update(['status' => BookingStatus::Cancelled]);

        $this->actingAs($this->customer)->postJson("/api/bookings/{$booking->id}/extensions", ['return_at' => $newReturn])
            ->assertOk()->assertJsonPath('data.extension.status', 'pending')->assertJsonPath('data.extension.extra_days', 2)->assertJsonPath('data.extension.amount', 11600);
        $this->actingAs($this->customer)->postJson("/api/bookings/{$booking->id}/extensions", ['return_at' => $newReturn->copy()->addDay()])->assertJsonValidationErrors('return_at');
        Notification::assertSentTo($this->manager, PlatformNotification::class, fn ($n) => $n->title === 'Extension requested');

        $extensionId = $booking->extensions()->sole()->id;
        $total = $booking->total;
        $this->actingAs($this->customer)->postJson("/api/booking-extensions/{$extensionId}/decide", ['decision' => 'approve'])->assertForbidden();
        $this->actingAs($this->manager)->postJson("/api/booking-extensions/{$extensionId}/decide", ['decision' => 'approve'])
            ->assertOk()->assertJsonPath('data.extension.status', 'approved')->assertJsonPath('data.days', 4);
        $this->assertSame($total + 11600, $booking->fresh()->total);
        $this->assertSame($total + 11600, $booking->fresh()->invoice->total);
        $this->assertTrue($booking->fresh()->return_at->eq($newReturn));
        Notification::assertSentTo($this->customer, PlatformNotification::class, fn ($n) => $n->title === 'Extension approved' && $n->sms);
    }

    public function test_refunds_record_how_the_money_went_back(): void
    {
        $booking = $this->confirmedBooking();
        $payment = $this->actingAs($this->manager)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 5000, 'method' => 'mpesa', 'transaction_code' => 'ABC123'])->json('data.id');
        $this->actingAs($this->manager)->postJson("/api/payments/{$payment}/refund", ['refund_method' => 'mpesa'])->assertJsonValidationErrors('refund_reference');
        $this->actingAs($this->manager)->postJson("/api/payments/{$payment}/refund", ['refund_method' => 'deposit'])->assertJsonValidationErrors('refund_method');
        $this->actingAs($this->manager)->postJson("/api/payments/{$payment}/refund", ['refund_method' => 'mpesa', 'refund_reference' => 'RFD1', 'refund_reason' => 'Booking moved'])
            ->assertOk()->assertJsonPath('data.refund_method', 'mpesa')->assertJsonPath('data.refund_reference', 'RFD1');
    }

    public function test_long_overdue_rentals_are_escalated_to_super_admins_once(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        Booking::factory()->for($this->vehicle)->create(['customer_id' => $this->customer->id, 'status' => BookingStatus::Active, 'pickup_at' => now()->subDays(4), 'return_at' => now()->subHours(30)]);

        $this->assertSame(1, app(BookingReminders::class)->send()['escalated']);
        $this->assertSame(0, app(BookingReminders::class)->send()['escalated']);
        Notification::assertSentTo($admin, PlatformNotification::class, fn ($n) => str_contains($n->title, 'h overdue'));
    }
}
