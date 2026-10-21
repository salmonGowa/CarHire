<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['severity' => ['nullable', Rule::in(['info', 'warning', 'critical'])]]);

        $logs = AuditLog::query()
            ->when($request->filled('severity'), fn ($q) => $q->where('severity', $request->string('severity')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('description', 'like', $term)->orWhere('actor', 'like', $term)->orWhere('ip_address', 'like', $term));
            })
            ->latest('created_at')->latest('id')
            ->paginate(min($request->integer('per_page', 50), 200));

        return response()->json([
            'data' => collect($logs->items())->map(fn (AuditLog $l) => [
                'id' => $l->id,
                'reference' => 'LOG-'.str_pad((string) $l->id, 5, '0', STR_PAD_LEFT),
                'at' => $l->created_at->toIso8601String(),
                'actor' => $l->actor,
                'action' => $l->action,
                'description' => $l->description,
                'severity' => $l->severity,
                'ip_address' => $l->ip_address,
            ]),
            'meta' => ['total' => $logs->total(), 'current_page' => $logs->currentPage(), 'last_page' => $logs->lastPage()],
        ]);
    }
}
