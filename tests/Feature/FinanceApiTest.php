<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceApiTest extends TestCase
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

    private function confirmedBooking(int $total = 11600, array $attrs = []): Booking
    {
        $booking = Booking::factory()->for(Vehicle::factory()->for($this->dealer))->create([
            'status' => BookingStatus::Pending, 'subtotal' => (int) round($total / 1.16), 'vat' => $total - (int) round($total / 1.16), 'total' => $total, ...$attrs,
        ]);
        $this->actingAs($this->staff)->patchJson("/api/bookings/{$booking->id}/status", ['status' => 'confirmed'])->assertOk();

        return $booking->fresh();
    }

    public function test_confirming_a_booking_issues_one_sequential_invoice(): void
    {
        $a = $this->confirmedBooking();
        $b = $this->confirmedBooking();

        $year = now()->year;
        $this->assertSame("INV-{$year}-00001", $a->invoice->number);
        $this->assertSame("INV-{$year}-00002", $b->invoice->number);
        $this->assertSame(11600, $a->invoice->total);
        $this->assertSame(1, Invoice::where('booking_id', $a->id)->count());
    }

    public function test_staff_booking_is_invoiced_immediately(): void
    {
        $vehicle = Vehicle::factory()->for($this->dealer)->create(['daily_rate' => 5000]);

        $this->actingAs($this->staff)->postJson('/api/bookings', [
            'vehicle_id' => $vehicle->id, 'pickup_at' => now()->addDay()->toDateTimeString(), 'return_at' => now()->addDays(2)->toDateTimeString(),
            'pickup_location' => 'CBD', 'customer_name' => 'Walk In', 'customer_phone' => '0700', 'customer_id_number' => '123',
        ])->assertCreated()->assertJsonPath('data.invoice.status', 'unpaid')->assertJsonPath('data.invoice.balance', 5800);
    }

    public function test_recording_payments_splits_vat_and_fee_and_tracks_balance(): void
    {
        $booking = $this->confirmedBooking(11600);

        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 5800, 'method' => 'cash'])
            ->assertCreated()
            ->assertJsonPath('data.vat', 800)          // 5800 * 16/116
            ->assertJsonPath('data.commission', 500)   // 10% of the 5000 pre-VAT
            ->assertJsonPath('data.dealer_net', 4500);

        $this->assertSame('partial', $booking->invoice->fresh()->status());

        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 5801, 'method' => 'cash'])
            ->assertUnprocessable()->assertJsonValidationErrors('amount');

        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 5800, 'method' => 'mpesa', 'transaction_code' => 'sab12cd34'])
            ->assertCreated()->assertJsonPath('data.transaction_code', 'SAB12CD34');

        $this->assertSame('paid', $booking->invoice->fresh()->status());
    }

    public function test_mpesa_codes_are_required_and_unique(): void
    {
        $booking = $this->confirmedBooking();

        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 100, 'method' => 'mpesa'])
            ->assertUnprocessable()->assertJsonValidationErrors('transaction_code');

        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 100, 'method' => 'mpesa', 'transaction_code' => 'X1'])->assertCreated();
        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 100, 'method' => 'mpesa', 'transaction_code' => 'x1'])
            ->assertUnprocessable()->assertJsonValidationErrors('transaction_code');
    }

    public function test_only_the_owning_dealer_records_payments_and_not_on_pending_bookings(): void
    {
        $booking = $this->confirmedBooking();
        $pending = Booking::factory()->for(Vehicle::factory()->for($this->dealer))->create(['status' => BookingStatus::Pending]);
        $otherStaff = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => Dealer::factory()->create()->id]);
        $customer = User::factory()->create();

        $this->actingAs($otherStaff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 100, 'method' => 'cash'])->assertForbidden();
        $this->actingAs($customer)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 100, 'method' => 'cash'])->assertForbidden();
        $this->actingAs($this->staff)->postJson("/api/bookings/{$pending->id}/payments", ['amount' => 100, 'method' => 'cash'])->assertForbidden();
    }

    public function test_cancelling_voids_unpaid_invoice_and_refund_reopens_balance(): void
    {
        $unpaid = $this->confirmedBooking();
        $this->actingAs($this->staff)->patchJson("/api/bookings/{$unpaid->id}/status", ['status' => 'cancelled']);
        $this->assertSame('void', $unpaid->invoice->fresh()->status());

        $paid = $this->confirmedBooking(11600);
        $paymentId = $this->actingAs($this->staff)->postJson("/api/bookings/{$paid->id}/payments", ['amount' => 11600, 'method' => 'cash'])->json('data.id');
        $this->actingAs($this->staff)->patchJson("/api/bookings/{$paid->id}/status", ['status' => 'cancelled']);
        $this->assertSame('paid', $paid->invoice->fresh()->status(), 'paid invoice stays open for a refund');

        $this->actingAs($this->staff)->postJson("/api/payments/{$paymentId}/refund")->assertOk()->assertJsonPath('data.status', 'refunded');
        $this->assertSame('void', $paid->invoice->fresh()->status());
        $this->actingAs($this->staff)->postJson("/api/payments/{$paymentId}/refund")->assertForbidden();
    }

    public function test_payout_cycle_nets_platform_collections_against_all_fees(): void
    {
        $booking = $this->confirmedBooking(23200);
        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 11600, 'method' => 'mpesa', 'transaction_code' => 'M1']);
        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 11600, 'method' => 'cash']);
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);

        $this->actingAs($this->staff)->postJson('/api/payouts/generate')->assertForbidden();

        $payout = $this->actingAs($admin)->postJson('/api/payouts/generate')->assertOk()->json('data.0');
        $this->assertSame(11600, $payout['gross_collected']);
        $this->assertSame(11600, $payout['cash_collected']);
        $this->assertSame(2000, $payout['commission']);
        $this->assertSame(9600, $payout['net']);

        // Nothing left to settle; settled payments can no longer be refunded.
        $this->actingAs($admin)->postJson('/api/payouts/generate')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($this->staff)->postJson('/api/payments/'.Payment::first()->id.'/refund')->assertForbidden();

        $this->actingAs($admin)->postJson("/api/payouts/{$payout['id']}/mark-paid", ['transfer_reference' => 'TRF-1'])
            ->assertOk()->assertJsonPath('data.status', 'paid');
        $this->actingAs($this->staff)->getJson('/api/payouts')->assertJsonCount(1, 'data')->assertJsonPath('data.0.transfer_reference', 'TRF-1');
    }

    public function test_invoices_and_payments_are_scoped(): void
    {
        $customer = User::factory()->create();
        $mine = $this->confirmedBooking(11600, ['customer_id' => $customer->id]);
        $this->confirmedBooking();
        $this->actingAs($this->staff)->postJson("/api/bookings/{$mine->id}/payments", ['amount' => 1000, 'method' => 'cash']);

        $this->actingAs($customer)->getJson('/api/invoices')->assertJsonCount(1, 'data')->assertJsonPath('data.0.balance', 10600);
        $this->actingAs($customer)->getJson('/api/payments')->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.commission');
        $this->actingAs($this->staff)->getJson('/api/invoices')->assertJsonCount(2, 'data');

        $outsider = User::factory()->create();
        $this->actingAs($outsider)->getJson("/api/invoices/{$mine->invoice->id}")->assertNotFound();
        $this->actingAs($customer)->getJson('/api/finance/summary')->assertForbidden();
    }

    public function test_finance_summary_totals_this_month(): void
    {
        $booking = $this->confirmedBooking(11600);
        $this->actingAs($this->staff)->postJson("/api/bookings/{$booking->id}/payments", ['amount' => 11600, 'method' => 'card']);

        $this->actingAs($this->staff)->getJson('/api/finance/summary')
            ->assertOk()
            ->assertJsonPath('month_to_date.gross', 11600)
            ->assertJsonPath('month_to_date.vat', 1600)
            ->assertJsonPath('month_to_date.commission', 1000)
            ->assertJsonPath('month_to_date.net', 9000)
            ->assertJsonPath('outstanding', 0)
            ->assertJsonPath('payouts.unsettled_net', 10600)
            ->assertJsonCount(6, 'monthly')
            ->assertJsonCount(7, 'last_7_days');
    }
}
