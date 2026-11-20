<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Support\Str;
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

        if (Settings::get('maintenance_mode') && ! $request->user()->isSuperAdmin()) {
            Auth::guard('web')->logout();

            abort(503, (string) Settings::get('maintenance_message'));
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
        abort_if(Settings::get('maintenance_mode'), 503, (string) Settings::get('maintenance_message'));
        if (! Settings::get("{$data['role']}_registration")) {
            throw ValidationException::withMessages(['role' => $data['role'] === UserRole::Dealer->value
                ? 'Dealer sign-up is closed. Contact DriveFleet to join as a dealer.'
                : 'Sign-up is closed at the moment. Please try again later.']);
        }

        $user = User::create($data);
        event(new Registered($user)); // sends the "confirm your email" link

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $user->toFrontend()], 201);
    }

    /**
     * Email a password-reset link. The answer is the same whether or not the
     * address has an account, so this can't be used to discover who's registered.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $status = PasswordBroker::sendResetLink(['email' => Str::lower($data['email'])]);
        if ($status === PasswordBroker::RESET_THROTTLED) {
            throw ValidationException::withMessages(['email' => 'A link was sent a moment ago. Please wait a minute before asking again.']);
        }
        if ($status === PasswordBroker::RESET_LINK_SENT) {
            AuditLog::record('auth.reset_requested', "Password reset link sent to {$data['email']}", User::where('email', Str::lower($data['email']))->first());
        }

        return response()->json(['message' => 'If that email has a DriveFleet account, a reset link is on its way. It expires in 60 minutes.']);
    }

    /** Set a new password from an emailed link; other devices are signed out. */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $status = PasswordBroker::reset($data, function (User $user, string $password) {
            // A new remember token and password hash end every other session (AuthenticateSession).
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            event(new PasswordReset($user));
            AuditLog::record('auth.password_reset', "Password reset by email for {$user->email}", $user, actor: $user);
        });

        if ($status !== PasswordBroker::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => $status === PasswordBroker::INVALID_TOKEN
                ? 'This reset link is invalid or has expired. Request a new one.'
                : __($status)]);
        }

        return response()->json(['message' => 'Your password has been changed. Sign in with the new one.']);
    }

    /** Send the "confirm your email" link again. */
    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->hasVerifiedEmail(), 422, 'Your email is already confirmed.');
        $user->sendEmailVerificationNotification();

        return response()->json(['message' => "We've sent a new link to {$user->email}."]);
    }

    /**
     * The link in the verification email. It's signed, so it works even when
     * opened in a browser where the user isn't signed in.
     */
    public function verifyEmail(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);
        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect($request->user()?->is($user) ? '/dashboard?verified=1' : '/login?verified=1');
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
