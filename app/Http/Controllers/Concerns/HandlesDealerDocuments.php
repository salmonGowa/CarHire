<?php

namespace App\Http\Controllers\Concerns;

use App\Models\AuditLog;
use App\Models\DealerDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

trait HandlesDealerDocuments
{
    /** @return array<string, array<int, string>> */
    protected function fileRules(): array
    {
        return ['file' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png']];
    }

    /** @return array<string, string> */
    protected function fileMessages(): array
    {
        return ['file.max' => 'Files can be up to 5 MB.', 'file.mimes' => 'Upload a PDF, JPG or PNG.'];
    }

    /** Store the uploaded file on the private disk and send the document for review. */
    protected function attachFile(DealerDocument $document, Request $request, User $by): DealerDocument
    {
        $file = $request->file('file');
        $old = $document->path;

        $document->update([
            'path' => $file->store("dealer-documents/{$document->dealer_id}", 'local'),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
            'status' => 'submitted',
            'uploaded_by' => $by->id,
            'submitted_at' => now(),
            'reviewed_by' => null,
            'reviewed_at' => null,
            'review_note' => null,
            ...($request->filled('expires_on') ? ['expires_on' => $request->date('expires_on')] : []),
        ]);
        if ($old && $old !== $document->path) {
            Storage::disk('local')->delete($old);
        }
        AuditLog::record('compliance.submitted', "Uploaded {$document->type} for {$document->dealer->name}", $document);

        return $document;
    }

    protected function streamFile(Request $request, DealerDocument $document): StreamedResponse
    {
        abort_unless($document->path && Storage::disk('local')->exists($document->path), 404, 'No file has been uploaded for this document.');

        return Storage::disk('local')->response($document->path, $document->original_name, ['Content-Type' => $document->mime_type],
            $request->boolean('inline') ? 'inline' : 'attachment');
    }

    /** @return array<string, mixed> */
    protected function presentDocument(DealerDocument $d): array
    {
        return [
            'id' => $d->id,
            'reference' => 'CMP-'.str_pad((string) $d->id, 4, '0', STR_PAD_LEFT),
            'dealer' => ['id' => $d->dealer->id, 'name' => $d->dealer->name],
            'type' => $d->type,
            'required' => in_array($d->type, DealerDocument::REQUIRED, true),
            'state' => $d->state(),
            'due_on' => $d->due_on?->toDateString(),
            'expires_on' => $d->expires_on?->toDateString(),
            'notes' => $d->notes,
            'review_note' => $d->review_note,
            'has_file' => $d->path !== null,
            'original_name' => $d->original_name,
            'size' => $d->size,
            'submitted_at' => $d->submitted_at?->toIso8601String(),
            'reviewed_at' => $d->reviewed_at?->toIso8601String(),
            'reviewer' => $d->reviewer?->name,
            'updated_at' => $d->updated_at->toIso8601String(),
        ];
    }

    /**
     * Required document types the dealer has no valid copy of, and whether
     * each is already being chased.
     *
     * @param  iterable<DealerDocument>  $documents
     * @return list<array{type: string, open: bool}>
     */
    protected function missingRequired(iterable $documents): array
    {
        $docs = collect($documents);

        return collect(DealerDocument::REQUIRED)
            ->reject(fn ($type) => $docs->contains(fn (DealerDocument $d) => $d->type === $type && $d->isValid()))
            ->map(fn ($type) => ['type' => $type, 'open' => $docs->contains(fn (DealerDocument $d) => $d->type === $type && $d->isOpen())])
            ->values()->all();
    }
}
