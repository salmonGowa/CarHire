<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Dealer;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DealerStaffApiTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;

    private User $manager;

    private User $agent;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dealer = Dealer::factory()->create();
        $this->manager = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id, 'dealer_role' => 'manager']);
        $this->agent = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $this->dealer->id, 'dealer_role' => 'staff']);
    }

    public function test_everyone_sees_the_team_but_only_managers_change_it(): void
    {
        $this->actingAs($this->agent)->getJson('/api/dealer-staff')->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('can_manage', false);
        $this->actingAs($this->agent)->postJson('/api/dealer-staff', ['name' => 'X', 'email' => 'x@x.test', 'job_title' => 'Agent', 'dealer_role' => 'staff'])->assertForbidden();

        $this->actingAs($this->manager)->postJson('/api/dealer-staff', ['name' => 'New Agent', 'email' => 'new@x.test', 'job_title' => 'Agent', 'dealer_role' => 'staff'])
            ->assertCreated()->assertJsonStructure(['temporary_password']);
        $other = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => Dealer::factory()->create()->id]);
        $this->actingAs($this->manager)->patchJson("/api/dealer-staff/{$other->id}", ['suspended' => true])->assertNotFound();
        $this->actingAs(User::factory()->create(['role' => UserRole::Customer]))->getJson('/api/dealer-staff')->assertForbidden();
    }

    public function test_plan_limit_and_manager_safeguards(): void
    {
        $plan = SubscriptionPlan::create(['name' => 'Starter', 'monthly_fee' => 3000, 'staff_limit' => 2]);
        $this->dealer->update(['subscription_plan_id' => $plan->id]);
        $this->actingAs($this->manager)->postJson('/api/dealer-staff', ['name' => 'X', 'email' => 'x@x.test', 'job_title' => 'A', 'dealer_role' => 'staff'])
            ->assertUnprocessable();

        $this->actingAs($this->manager)->patchJson("/api/dealer-staff/{$this->manager->id}", ['dealer_role' => 'staff'])->assertUnprocessable();
        $this->actingAs($this->manager)->patchJson("/api/dealer-staff/{$this->manager->id}", ['suspended' => true])->assertUnprocessable();

        $this->actingAs($this->manager)->patchJson("/api/dealer-staff/{$this->agent->id}", ['suspended' => true])->assertJsonPath('data.status', 'suspended');
        $this->actingAs($this->manager)->patchJson("/api/dealer-staff/{$this->agent->id}", ['suspended' => false, 'dealer_role' => 'manager'])
            ->assertJsonPath('data.status', 'active')->assertJsonPath('data.dealer_role', 'manager');
    }

    public function test_reset_password_and_admin_promotion(): void
    {
        $password = $this->actingAs($this->manager)->postJson("/api/dealer-staff/{$this->agent->id}/reset-password")->assertOk()->json('temporary_password');
        $this->assertTrue(Hash::check($password, $this->agent->fresh()->password));
        $this->actingAs($this->manager)->postJson("/api/dealer-staff/{$this->manager->id}/reset-password")->assertUnprocessable();

        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->actingAs($admin)->patchJson("/api/admin/dealers/{$this->dealer->id}/staff/{$this->agent->id}", ['dealer_role' => 'manager'])
            ->assertJsonPath('data.dealer_role', 'manager');
    }

    public function test_search_is_scoped_by_role(): void
    {
        $this->actingAs($this->agent)->getJson('/api/search?q=a')->assertJsonPath('data', []); // too short
        $customer = User::factory()->create(['role' => UserRole::Customer, 'name' => 'Zawadi Unique']);
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->actingAs($admin)->getJson('/api/search?q=Zawadi')->assertJsonPath('data.0.group', 'Clients')
            ->assertJsonPath('data.0.results.0.link', "/superadmin-clients?open={$customer->id}");
        $this->actingAs($this->agent)->getJson('/api/search?q=Zawadi')->assertJsonPath('data', []);
    }
}
