<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\Settings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json($this->payload());
    }

    public function update(Request $request): JsonResponse
    {
        Settings::update($request->all(), $request->user());

        return response()->json($this->payload());
    }

    /** @return array<string, mixed> */
    private function payload(): array
    {
        $updated = DB::table('settings')->leftJoin('users', 'users.id', '=', 'settings.updated_by')
            ->orderByDesc('settings.updated_at')->first(['settings.updated_at', 'users.name']);

        return [
            'data' => Settings::all(),
            // Fixed by law or deployment, shown for reference only.
            'fixed' => [
                'vat_rate' => (float) config('drivefleet.vat_rate'),
                'currency' => 'KES',
                'timezone' => config('app.timezone'),
            ],
            'last_updated' => $updated ? ['at' => $updated->updated_at, 'by' => $updated->name] : null,
        ];
    }
}
