<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Accounts created by an admin get a random temporary password, returned once
 * so the admin can pass it on. (There is no email delivery yet.)
 */
trait CreatesAccounts
{
    /**
     * @param  array<string, mixed>  $attributes
     * @return array{0: User, 1: string}
     */
    protected function createAccount(UserRole $role, array $attributes): array
    {
        $password = Str::password(12, symbols: false);
        $user = User::create([...$attributes, 'role' => $role, 'password' => $password, 'email_verified_at' => now()]);

        return [$user, $password];
    }
}
