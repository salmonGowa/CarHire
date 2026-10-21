<?php

namespace App\Http\Middleware;

use App\Support\Settings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Apply runtime settings that Laravel reads from config. Runs before the
 * session starts so the idle sign-out time takes effect.
 */
class ApplyPlatformSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        config(['session.lifetime' => (int) Settings::get('session_lifetime_minutes')]);

        return $next($request);
    }
}
