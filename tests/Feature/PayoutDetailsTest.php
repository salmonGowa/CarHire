<?php

namespace Tests\Feature;

use App\Enums\PayoutStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Dealer;
use App\Models\Payout;
use App\Models\User;
use App\Notifications\PlatformNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PayoutDetailsTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;

    private User $manager;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dealer = Dealer::factory()->create(['name' => 'Acme Hire']);
        $this->manager = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id, 'dealer_role' => 'manager', 'name' => 'Mary Manager']);
        $this->staff = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id, 'dealer_role' => 'staff']);
    }

    private function bank(array $extra = []): array
    {
        return ['password' => 'password', 'method' => 'bank', 'account_name' => 'Acme Hire Ltd', 'bank_name' => 'Equity Bank', 'bank_branch' => 'Westlands', 'account_number' => '0123 4567 8901', ...$extra];
    }

    public function test_managers_set_bank_details_with_their_password_and_everyone_is_told(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);

        $this->actingAs($this->staff)->putJson('/api/dealer-payout-details', $this->bank())->assertForbidden();
        $this->actingAs($this->manager)->putJson('/api/dealer-payout-details', $this->bank(['password' => 'wrong']))->assertJsonValidationErrors('password');
        $this->actingAs($this->manager)->putJson('/api/dealer-payout-details', $this->bank(['account_number' => 'abc']))->assertJsonValidationErrors('account_number');
        $this->actingAs($this->manager)->putJson('/api/dealer-payout-details', $this->bank(['bank_name' => null]))->assertJsonValidationErrors('bank_name');

        $this->actingAs($this->manager)->putJson('/api/dealer-payout-details', $this->bank())
            ->assertOk()->assertJsonPath('data.account_number', '012345678901')->assertJsonPath('data.recently_changed', true)
            ->assertJsonPath('data.summary', 'Equity Bank, Westlands · 012345678901 (Acme Hire Ltd)');

        // Other staff see it masked and can't edit.
        $this->actingAs($this->staff)->getJson('/api/dealer-payout-details')->assertJsonPath('can_edit', false)
            ->assertJsonPath('data.account_number', '••••••••8901');

        $this->assertStringContainsString('••••8901', AuditLog::where('action', 'dealer.payout_details_updated')->sole()->description);
        Notification::assertSentTo($this->manager, PlatformNotification::class, fn ($n) => $n->title === 'Payout details changed');
        Notification::assertSentTo($admin, PlatformNotification::class, fn ($n) => $n->title === 'Dealer payout details changed');
        Notification::assertNotSentTo($this->staff, PlatformNotification::class);
    }

    public function test_mpesa_destinations(): void
    {
        $put = fn (array $data) => $this->actingAs($this->manager)->putJson('/api/dealer-payout-details', ['password' => 'password', 'method' => 'mpesa', 'account_name' => 'Acme Hire', ...$data]);

        $put(['mpesa_type' => 'phone', 'mpesa_number' => '020 123 4567'])->assertJsonValidationErrors('mpesa_number');
        $put(['mpesa_type' => 'paybill', 'mpesa_number' => '522522'])->assertJsonValidationErrors('mpesa_account');
        $put(['mpesa_type' => 'till', 'mpesa_number' => '12'])->assertJsonValidationErrors('mpesa_number');

        $put(['mpesa_type' => 'paybill', 'mpesa_number' => '522522', 'mpesa_account' => 'ACME01'])
            ->assertOk()->assertJsonPath('data.summary', 'M-PESA Paybill 522522 · account ACME01 (Acme Hire)');
        $put(['mpesa_type' => 'phone', 'mpesa_number' => '0712 345 678'])
            ->assertOk()->assertJsonPath('data.mpesa_number', '+254712345678')->assertJsonPath('data.mpesa_account', null)->assertJsonPath('data.bank_name', null);
    }

    public function test_admins_see_where_to_send_a_payout_and_the_paid_payout_keeps_it(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->actingAs($this->manager)->putJson('/api/dealer-payout-details', $this->bank())->assertOk();
        $payout = Payout::create(['dealer_id' => $this->dealer->id, 'period_start' => now()->subWeek(), 'period_end' => now(), 'payment_count' => 1,
            'gross_collected' => 10000, 'cash_collected' => 0, 'commission' => 862, 'net' => 9138, 'status' => PayoutStatus::Pending, 'created_by' => $admin->id]);

        $this->actingAs($admin)->getJson('/api/payouts')->assertJsonPath('data.0.destination.account_number', '012345678901')
            ->assertJsonPath('data.0.destination.recently_changed', true);
        $this->actingAs($this->staff)->getJson('/api/payouts')->assertJsonPath('data.0.destination.account_number', '••••••••8901');

        $this->actingAs($admin)->postJson("/api/payouts/{$payout->id}/mark-paid", ['transfer_reference' => 'EQ123'])
            ->assertOk()->assertJsonPath('data.paid_to', 'Equity Bank, Westlands · 012345678901 (Acme Hire Ltd)');

        // Changing the details later doesn't rewrite where an old payout went.
        $this->travel(3)->days();
        $this->actingAs($this->manager)->putJson('/api/dealer-payout-details', $this->bank(['account_number' => '999999999']))->assertOk()
            ->assertJsonPath('data.recently_changed', true);
        $this->assertSame('Equity Bank, Westlands · 012345678901 (Acme Hire Ltd)', $payout->fresh()->paid_to);
    }
}
