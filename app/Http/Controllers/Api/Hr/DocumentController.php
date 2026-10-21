<?php

namespace App\Http\Controllers\Api\Hr;

use App\Http\Controllers\Controller;
use App\Models\EmployeeDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Employee documents live on the private disk and are only streamed to HR.
 */
class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $docs = EmployeeDocument::query()
            ->with('employee')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('type', 'like', $term)->orWhereHas('employee', fn ($e) => $e->where('name', 'like', $term)));
            })
            ->latest()
            ->limit(300)
            ->get();

        return response()->json([
            'data' => $docs->map(fn (EmployeeDocument $d) => $this->present($d)),
            'summary' => [
                'total' => EmployeeDocument::count(),
                'pending' => EmployeeDocument::where('status', 'pending')->count(),
                'expiring' => EmployeeDocument::whereNotNull('expires_on')->where('expires_on', '<=', today()->addDays(60))->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'type' => ['required', Rule::in(EmployeeDocument::TYPES)],
            'expires_on' => ['nullable', 'date'],
            'file' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
        ], ['file.max' => 'Files can be up to 5 MB.', 'file.mimes' => 'Upload a PDF, JPG or PNG.']);

        $file = $request->file('file');
        $doc = EmployeeDocument::create([
            'employee_id' => $data['employee_id'],
            'type' => $data['type'],
            'expires_on' => $data['expires_on'] ?? null,
            'path' => $file->store("employee-documents/{$data['employee_id']}", 'local'),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
            'status' => 'pending',
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $this->present($doc->load('employee'))], 201);
    }

    public function download(Request $request, EmployeeDocument $document): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($document->path), 404, 'The file is missing from storage.');
        $disposition = $request->boolean('inline') ? 'inline' : 'attachment';

        return Storage::disk('local')->response($document->path, $document->original_name, ['Content-Type' => $document->mime_type], $disposition);
    }

    public function review(Request $request, EmployeeDocument $document): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['verified', 'rejected'])]]);
        $document->update([...$data, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);

        return response()->json(['data' => $this->present($document->load('employee'))]);
    }

    public function destroy(EmployeeDocument $document): Response
    {
        Storage::disk('local')->delete($document->path);
        $document->delete();

        return response()->noContent();
    }

    /** @return array<string, mixed> */
    private function present(EmployeeDocument $d): array
    {
        return [
            'id' => $d->id,
            'employee' => ['id' => $d->employee->id, 'name' => $d->employee->name],
            'type' => $d->type,
            'original_name' => $d->original_name,
            'format' => strtoupper(pathinfo($d->original_name, PATHINFO_EXTENSION) ?: 'file'),
            'size' => $d->size,
            'uploaded_at' => $d->created_at->toIso8601String(),
            'expires_on' => $d->expires_on?->toDateString(),
            'expiring' => $d->isExpiringSoon(),
            'status' => $d->status,
        ];
    }
}
