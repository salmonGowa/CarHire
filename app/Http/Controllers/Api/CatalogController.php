<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class CatalogController extends Controller
{
    /**
     * Vehicles a customer can book, optionally limited to those free for a date range.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after:from'],
        ]);

        $userId = $request->user()->id;

        $vehicles = Vehicle::query()
            ->bookable()
            ->with('dealer')
            ->withExists(['savedBy as is_saved' => fn ($q) => $q->where('users.id', $userId)])
            ->withAvg('bookings', 'rating')
            ->when($request->filled('type') && $request->input('type') !== 'All', fn ($q) => $q->where('type', $request->string('type')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where('model', 'like', '%'.$request->string('search').'%');
            })
            ->when($request->filled(['from', 'to']), function ($q) use ($request) {
                $from = Carbon::parse($request->input('from'));
                $to = Carbon::parse($request->input('to'));
                $q->whereDoesntHave('bookings', fn ($b) => $b
                    ->whereIn('status', BookingStatus::blocking())
                    ->where('pickup_at', '<', $to)
                    ->where('return_at', '>', $from));
            })
            ->orderBy('daily_rate')
            ->paginate(min($request->integer('per_page', 50), 100));

        return VehicleResource::collection($vehicles);
    }
}
