<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(['unpaid', 'partial', 'paid', 'void', 'open'])]]);

        $invoices = Invoice::query()
            ->visibleTo($request->user())
            ->with(['booking.vehicle', 'dealer'])
            ->when($request->input('status'), function ($q, string $status) {
                match ($status) {
                    'void' => $q->whereNotNull('voided_at'),
                    'paid' => $q->whereNull('voided_at')->whereColumn('amount_paid', '>=', 'total'),
                    'partial' => $q->whereNull('voided_at')->where('amount_paid', '>', 0)->whereColumn('amount_paid', '<', 'total'),
                    'unpaid' => $q->whereNull('voided_at')->where('amount_paid', 0),
                    'open' => $q->whereNull('voided_at')->whereColumn('amount_paid', '<', 'total'),
                };
            })
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('number', 'like', $term)->orWhere('customer_name', 'like', $term));
            })
            ->orderByDesc('issued_at')
            ->paginate(min($request->integer('per_page', 50), 200));

        return InvoiceResource::collection($invoices);
    }

    public function show(Request $request, Invoice $invoice): InvoiceResource
    {
        abort_unless(Invoice::visibleTo($request->user())->whereKey($invoice->id)->exists(), 404);

        return new InvoiceResource($invoice->load(['booking.vehicle', 'dealer', 'payments' => fn ($q) => $q->orderByDesc('paid_at')]));
    }
}
