<?php

namespace App\Providers;

use App\Support\Settings;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Events\MigrationsEnded;
use Illuminate\Foundation\DevCommands;
use Illuminate\Http\Request;
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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // `php artisan dev` runs the Laravel server and Vite together. The app
        // has no queued jobs yet, so skip the queue worker (it needs a database).
        DevCommands::except('queue');

        // Login attempts are limited per email + IP, so one person mistyping
        // a password doesn't lock out everyone behind the same network.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute((int) Settings::get('login_attempts_per_minute'))
            ->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));

        // Settings are cached; a migrate (or migrate:fresh) must not leave stale values behind.
        Event::listen(MigrationsEnded::class, fn () => Settings::flush());

        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
    }
}
