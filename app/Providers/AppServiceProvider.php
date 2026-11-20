<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Sms\AfricasTalkingSmsSender;
use App\Services\Sms\LogSmsSender;
use App\Services\Sms\SmsSender;
use App\Support\Settings;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Events\MigrationsEnded;
use Illuminate\Foundation\DevCommands;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Text messages go to the log unless Africa's Talking is configured (SMS_DRIVER=africastalking).
        $this->app->singleton(SmsSender::class, fn () => config('services.sms.driver') === 'africastalking'
            ? new AfricasTalkingSmsSender(
                (string) config('services.africastalking.username'),
                (string) config('services.africastalking.api_key'),
                config('services.africastalking.sender_id') ?: null,
            )
            : new LogSmsSender);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // `php artisan dev` runs the server, Vite, a queue worker (emails and texts)
        // and the scheduler (billing, reminders) together.
        DevCommands::artisan('schedule:work', 'scheduler');

        // Login attempts are limited per email + IP, so one person mistyping
        // a password doesn't lock out everyone behind the same network.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute((int) Settings::get('login_attempts_per_minute'))
            ->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));

        // Settings are cached; a migrate (or migrate:fresh) must not leave stale values behind.
        Event::listen(MigrationsEnded::class, fn () => Settings::flush());

        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('password-reset', fn (Request $request) => Limit::perMinute(5)->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));

        // Reset links open the SPA's reset page rather than a Blade view.
        ResetPassword::createUrlUsing(fn (User $user, string $token) => url('/reset-password?'.http_build_query(['token' => $token, 'email' => $user->getEmailForPasswordReset()])));
        ResetPassword::toMailUsing(fn (User $user, string $token) => (new MailMessage)
            ->subject('Reset your DriveFleet password')
            ->greeting('Hi '.Str::before($user->name, ' ').',')
            ->line('We received a request to reset the password for your DriveFleet account.')
            ->action('Choose a new password', url('/reset-password?'.http_build_query(['token' => $token, 'email' => $user->getEmailForPasswordReset()])))
            ->line('The link expires in 60 minutes. If you didn\'t ask for this, you can ignore this email; your password won\'t change.')
            ->salutation('— The DriveFleet team'));
        VerifyEmail::toMailUsing(fn (User $user, string $url) => (new MailMessage)
            ->subject('Confirm your email for DriveFleet')
            ->greeting('Welcome, '.Str::before($user->name, ' ').'!')
            ->line('Please confirm this is your email address so we can send you booking confirmations and receipts.')
            ->action('Confirm email', $url)
            ->salutation('— The DriveFleet team'));
    }
}
