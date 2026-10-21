<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = $this->filtered($request)->paginate(min($request->integer('per_page', 50), 200));

        return response()->json([
            'data' => collect($logs->items())->map(fn (AuditLog $l) => $this->present($l)),
            'meta' => ['total' => $logs->total(), 'current_page' => $logs->currentPage(), 'last_page' => $logs->lastPage()],
        ]);
    }

    /** Every matching entry as CSV, not just the current page. */
    public function export(Request $request): StreamedResponse
    {
        $query = $this->filtered($request);
        AuditLog::record('audit.exported', 'Exported the audit log', severity: 'warning');

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Reference', 'Time', 'Actor', 'Action', 'Description', 'Severity', 'IP address']);
            foreach ($query->cursor() as $log) {
                $row = $this->present($log);
                fputcsv($out, [$row['reference'], $row['at'], $row['actor'], $row['action'], $row['description'], $row['severity'], $row['ip_address']]);
            }
            fclose($out);
        }, 'audit-log-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }

    /** @return Builder<AuditLog> */
    private function filtered(Request $request): Builder
    {
        $request->validate(['severity' => ['nullable', Rule::in(['info', 'warning', 'critical'])]]);

        return AuditLog::query()
            ->when($request->filled('severity'), fn ($q) => $q->where('severity', $request->string('severity')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('description', 'like', $term)->orWhere('actor', 'like', $term)
                    ->orWhere('action', 'like', $term)->orWhere('ip_address', 'like', $term));
            })
            ->latest('created_at')->latest('id');
    }

    /** @return array<string, mixed> */
    private function present(AuditLog $l): array
    {
        return [
            'id' => $l->id,
            'reference' => 'LOG-'.str_pad((string) $l->id, 5, '0', STR_PAD_LEFT),
            'at' => $l->created_at->toIso8601String(),
            'actor' => $l->actor,
            'action' => $l->action,
            'description' => $l->description,
            'severity' => $l->severity,
            'ip_address' => $l->ip_address,
        ];
    }
}
