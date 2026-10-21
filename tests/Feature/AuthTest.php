<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_the_users_stored_role(): void
    {
        $user = User::factory()->create(['role' => UserRole::Hr]);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('user.role', 'hr')
            ->assertJsonPath('user.email', $user->email);

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_ignores_a_role_sent_by_the_client(): void
    {
        $user = User::factory()->create(['role' => UserRole::Customer]);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password', 'role' => 'superadmin'])
            ->assertOk()
            ->assertJsonPath('user.role', 'customer');
    }

    public function test_wrong_password_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_current_user_endpoint(): void
    {
        $this->getJson('/api/auth/user')->assertOk()->assertJson(['user' => null]);

        $user = User::factory()->create(['role' => UserRole::Dealer]);

        $this->actingAs($user)->getJson('/api/auth/user')->assertJsonPath('user.role', 'dealer');
    }

    public function test_spa_shell_embeds_the_signed_in_user(): void
    {
        $user = User::factory()->create(['role' => UserRole::Dealer]);

        $this->actingAs($user)->get('/dashboard')->assertOk()->assertSee('"role":"dealer"', false);
    }

    public function test_register_creates_a_signed_in_customer(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Amina Hassan',
            'email' => 'amina@example.com',
            'role' => 'customer',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ])->assertCreated()->assertJsonPath('user.role', 'customer');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'amina@example.com', 'role' => 'customer']);
    }

    public function test_register_cannot_create_privileged_roles(): void
    {
        foreach (['superadmin', 'hr'] as $role) {
            $this->postJson('/api/auth/register', [
                'name' => 'Sneaky',
                'email' => "{$role}@example.com",
                'role' => $role,
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
            ])->assertUnprocessable()->assertJsonValidationErrors('role');
        }

        $this->assertDatabaseCount('users', 0);
    }

    public function test_dealer_registration_requires_a_company(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'New Dealer',
            'email' => 'dealer@example.com',
            'role' => 'dealer',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('company');
    }

    public function test_logout(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/auth/logout')->assertOk()->assertJson(['user' => null]);

        $this->assertGuest('web');
    }

    public function test_login_is_throttled_per_email(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])->assertTooManyRequests();

        // A different account from the same IP is unaffected.
        $other = User::factory()->create();
        $this->postJson('/api/auth/login', ['email' => $other->email, 'password' => 'password'])->assertOk();
    }
}
