<?php

namespace App\Http\Middleware;

use App\Support\Settings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * While maintenance mode is on, only super admins can use the API. Signing in
 * and out stays open so admins can get in (AuthController turns others away).
 * The SPA shell still loads and shows the maintenance message.
 */
class EnforceMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Settings::get('maintenance_mode')
            && $request->is('api/*')
            && ! $request->is('api/auth/*')
            && ! $request->user()?->isSuperAdmin()) {
            abort(503, (string) Settings::get('maintenance_message'));
        }

        return $next($request);
    }
}
