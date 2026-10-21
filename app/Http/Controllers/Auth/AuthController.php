<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * The currently signed-in user, or null.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()?->toFrontend()]);
    }

    /**
     * Sign in with email and password. The user's stored role decides which
     * dashboard the frontend shows.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            AuditLog::record('auth.failed', "Failed sign-in for {$credentials['email']}", severity: 'warning');

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if ($request->user()->isDisabled()) {
            Auth::guard('web')->logout();
            AuditLog::record('auth.blocked', "Sign-in blocked for suspended account {$credentials['email']}", severity: 'warning');

            throw ValidationException::withMessages([
                'email' => 'This account has been suspended. Contact DriveFleet support.',
            ]);
        }

        $request->session()->regenerate();
        $request->user()->forceFill(['last_login_at' => now()])->save();

        return response()->json(['user' => $request->user()->toFrontend()]);
    }

    /**
     * Create a customer or dealer account and sign it in.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company' => [Rule::requiredIf($request->input('role') === UserRole::Dealer->value), 'nullable', 'string', 'max:255'],
            'role' => ['required', Rule::enum(UserRole::class)->only(UserRole::selfRegisterable())],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create($data);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $user->toFrontend()], 201);
    }

    /**
     * Sign out and invalidate the session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['user' => null]);
    }
}
