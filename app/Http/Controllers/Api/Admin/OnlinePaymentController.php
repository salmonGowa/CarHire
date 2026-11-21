<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OnlinePaymentResource;
use App\Models\OnlinePayment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Every online payment attempt across dealers, for support and reconciliation.
 * "attention" lists money that arrived but couldn't be put on an invoice.
 */
class OnlinePaymentController extends Controller
{
    private const FILTERS = ['attention', 'pending', 'succeeded', 'unsuccessful'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $filter = in_array($request->query('status'), self::FILTERS, true) ? $request->query('status') : null;

        $payments = OnlinePayment::query()
            ->with(['booking', 'dealer'])
            ->when($filter === 'attention', fn ($q) => $q->needingAttention())
            ->when($filter === 'pending', fn ($q) => $q->pending())
            ->when($filter === 'succeeded', fn ($q) => $q->where('status', OnlinePayment::SUCCEEDED))
            ->when($filter === 'unsuccessful', fn ($q) => $q->whereIn('status', [OnlinePayment::FAILED, OnlinePayment::CANCELLED, OnlinePayment::EXPIRED]))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 50), 200));

        $since = now()->subDays(30);

        return OnlinePaymentResource::collection($payments)->additional(['summary' => [
            'attention' => OnlinePayment::needingAttention()->count(),
            'pending' => OnlinePayment::pending()->count(),
            'succeeded_30d' => OnlinePayment::where('status', OnlinePayment::SUCCEEDED)->where('created_at', '>=', $since)->count(),
            'unsuccessful_30d' => OnlinePayment::whereIn('status', [OnlinePayment::FAILED, OnlinePayment::CANCELLED, OnlinePayment::EXPIRED])->where('created_at', '>=', $since)->count(),
        ]]);
    }
}
