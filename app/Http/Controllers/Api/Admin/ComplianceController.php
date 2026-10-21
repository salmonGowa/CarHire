<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\DealerStatus;
use App\Http\Controllers\Concerns\HandlesDealerDocuments;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dealer;
use App\Models\DealerDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Dealer licences, tax certificates and insurance: request them, review
 * uploads, and see which dealers are missing something.
 */
class ComplianceController extends Controller
{
    use HandlesDealerDocuments;

    private const STATES = ['requested', 'overdue', 'pending_review', 'verified', 'expiring', 'expired', 'rejected', 'superseded'];

    public function index(Request $request): JsonResponse
    {
        $request->validate(['state' => ['nullable', Rule::in(self::STATES)]]);

        $all = DealerDocument::with(['dealer', 'reviewer'])->latest('updated_at')->latest('id')->get();
        $term = mb_strtolower(trim((string) $request->input('search')));
        $state = $request->input('state');

        $rows = $all->filter(fn (DealerDocument $d) => $state ? $d->state() === $state : $d->state() !== 'superseded')
            ->filter(fn (DealerDocument $d) => $term === '' || str_contains(mb_strtolower("{$d->dealer->name} {$d->type} CMP-{$d->id}"), $term))
            ->when($request->filled('dealer_id'), fn ($c) => $c->where('dealer_id', $request->integer('dealer_id')));

        $active = Dealer::where('status', DealerStatus::Active)->orderBy('name')->get();
        $byDealer = $all->groupBy('dealer_id');
        $gaps = $active->map(fn (Dealer $dealer) => ['dealer' => ['id' => $dealer->id, 'name' => $dealer->name], 'missing' => $this->missingRequired($byDealer->get($dealer->id, []))])
            ->filter(fn ($g) => $g['missing'] !== [])->values();
        $states = $all->map(fn (DealerDocument $d) => $d->state())->countBy();

        return response()->json([
            'data' => $rows->values()->map(fn (DealerDocument $d) => $this->presentDocument($d)),
            'gaps' => $gaps,
            'types' => DealerDocument::TYPES,
            'required_types' => DealerDocument::REQUIRED,
            'summary' => [
                'pending_review' => $states->get('pending_review', 0),
                'action_needed' => $states->only(['overdue', 'expired', 'expiring', 'rejected'])->sum(),
                'awaiting_dealer' => $states->only(['requested', 'overdue', 'rejected'])->sum(),
                'active_dealers' => $active->count(),
                'compliant_dealers' => $active->count() - $gaps->count(),
                'compliance_rate' => $active->isEmpty() ? 100 : (int) round(($active->count() - $gaps->count()) / $active->count() * 100),
            ],
        ]);
    }

    /** Ask a dealer for a document. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dealer_id' => ['required', 'integer', 'exists:dealers,id'],
            'type' => ['required', Rule::in(DealerDocument::TYPES)],
            'due_on' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        $exists = DealerDocument::where('dealer_id', $data['dealer_id'])->where('type', $data['type'])->whereIn('status', ['requested', 'submitted', 'rejected'])->exists();
        abort_if($exists, 422, 'There is already an open request for that document.');

        $doc = DealerDocument::create([...$data, 'status' => 'requested', 'requested_by' => $request->user()->id]);
        AuditLog::record('compliance.requested', "Requested {$doc->type} from {$doc->dealer->name}", $doc);

        return response()->json(['data' => $this->presentDocument($doc->load('dealer'))], 201);
    }

    /** Upload on the dealer's behalf (e.g. they emailed it in). */
    public function upload(Request $request, DealerDocument $document): JsonResponse
    {
        abort_if($document->status === 'superseded', 422, 'That document has been replaced by a newer one.');
        $request->validate([...$this->fileRules(), 'expires_on' => ['nullable', 'date']], $this->fileMessages());

        return response()->json(['data' => $this->presentDocument($this->attachFile($document, $request, $request->user())->load('dealer'))]);
    }

    public function review(Request $request, DealerDocument $document): JsonResponse
    {
        $data = $request->validate([
            'decision' => ['required', Rule::in(['verified', 'rejected'])],
            'expires_on' => ['nullable', 'date', 'after:today'],
            'note' => ['nullable', 'required_if:decision,rejected', 'string', 'max:1000'],
        ], ['note.required_if' => 'Give the dealer a reason so they can fix it.']);
        abort_unless($document->status === 'submitted', 422, 'Only submitted documents can be reviewed.');

        DB::transaction(function () use ($document, $data, $request) {
            $document->update([
                'status' => $data['decision'],
                'expires_on' => $data['decision'] === 'verified' ? ($data['expires_on'] ?? $document->expires_on) : $document->expires_on,
                'review_note' => $data['note'] ?? null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
            if ($data['decision'] === 'verified') {
                // Older copies of the same document are replaced by this one.
                DealerDocument::where('dealer_id', $document->dealer_id)->where('type', $document->type)
                    ->whereKeyNot($document->id)->where('status', 'verified')->update(['status' => 'superseded']);
            }
        });

        AuditLog::record("compliance.{$data['decision']}", ucfirst($data['decision'])." {$document->type} for {$document->dealer->name}".
            (isset($data['note']) ? ": {$data['note']}" : ''), $document, $data['decision'] === 'rejected' ? 'warning' : 'info');

        return response()->json(['data' => $this->presentDocument($document->load(['dealer', 'reviewer']))]);
    }

    public function download(Request $request, DealerDocument $document): StreamedResponse
    {
        return $this->streamFile($request, $document);
    }

    public function destroy(DealerDocument $document): Response
    {
        if ($document->path) {
            Storage::disk('local')->delete($document->path);
        }
        AuditLog::record('compliance.deleted', "Deleted {$document->type} record for {$document->dealer->name}", null, 'warning');
        $document->delete();

        return response()->noContent();
    }
}
