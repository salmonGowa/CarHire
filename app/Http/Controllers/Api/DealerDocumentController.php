<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\HandlesDealerDocuments;
use App\Http\Controllers\Controller;
use App\Models\Dealer;
use App\Models\DealerDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A dealer's own compliance documents: see what's requested and upload it.
 */
class DealerDocumentController extends Controller
{
    use HandlesDealerDocuments;

    public function index(Request $request): JsonResponse
    {
        $dealer = $this->dealer($request);
        $docs = $dealer->documents()->with(['dealer', 'reviewer'])->where('status', '!=', 'superseded')->latest('updated_at')->latest('id')->get();

        return response()->json([
            'data' => $docs->map(fn (DealerDocument $d) => $this->presentDocument($d)),
            'missing' => $this->missingRequired($docs),
            'types' => DealerDocument::TYPES,
        ]);
    }

    /** Submit a document nobody asked for yet (a renewal, or a required one). */
    public function store(Request $request): JsonResponse
    {
        $dealer = $this->dealer($request);
        $data = $request->validate([
            'type' => ['required', Rule::in(DealerDocument::TYPES)],
            'expires_on' => ['nullable', 'date'],
            ...$this->fileRules(),
        ], $this->fileMessages());

        // Answer an outstanding request for this type rather than starting a parallel one.
        $doc = $dealer->documents()->where('type', $data['type'])->whereIn('status', ['requested', 'rejected'])->latest()->first()
            ?? $dealer->documents()->create(['type' => $data['type'], 'status' => 'requested']);
        abort_if($dealer->documents()->where('type', $data['type'])->where('status', 'submitted')->whereKeyNot($doc->id)->exists(), 422,
            'A copy of that document is already waiting for review.');

        return response()->json(['data' => $this->presentDocument($this->attachFile($doc->setRelation('dealer', $dealer), $request, $request->user()))], 201);
    }

    /** Upload the file for a requested or rejected document. */
    public function upload(Request $request, DealerDocument $document): JsonResponse
    {
        $dealer = $this->dealer($request);
        abort_unless($document->dealer_id === $dealer->id, 404);
        abort_unless(in_array($document->status, ['requested', 'rejected', 'submitted'], true), 422, 'Upload a new copy instead of replacing a verified document.');
        $request->validate([...$this->fileRules(), 'expires_on' => ['nullable', 'date']], $this->fileMessages());

        return response()->json(['data' => $this->presentDocument($this->attachFile($document->setRelation('dealer', $dealer), $request, $request->user()))]);
    }

    public function download(Request $request, DealerDocument $document): StreamedResponse
    {
        abort_unless($document->dealer_id === $this->dealer($request)->id, 404);

        return $this->streamFile($request, $document);
    }

    private function dealer(Request $request): Dealer
    {
        $dealer = $request->user()->dealer;
        abort_unless($dealer, 403);

        return $dealer;
    }
}
