<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRequest;
use App\Http\Resources\VehicleResource;
use App\Models\AuditLog;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class VehicleController extends Controller
{
    /**
     * Fleet list: a dealer's own vehicles, or every vehicle for a super admin.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Vehicle::class);
        $user = $request->user();

        $vehicles = Vehicle::query()
            ->with('dealer')
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->where('dealer_id', $user->dealer_id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('model', 'like', $term)->orWhere('plate', 'like', $term));
            })
            ->orderBy('model')
            ->paginate(min($request->integer('per_page', 50), 100));

        return VehicleResource::collection($vehicles);
    }

    public function store(VehicleRequest $request): VehicleResource
    {
        Gate::authorize('create', Vehicle::class);
        $user = $request->user();

        $vehicle = Vehicle::create([
            ...$request->validated(),
            'dealer_id' => $user->isSuperAdmin() ? $request->integer('dealer_id') : $user->dealer_id,
        ]);

        AuditLog::record('vehicle.created', "Added vehicle {$vehicle->plate} ({$vehicle->model})", $vehicle);

        return new VehicleResource($vehicle->load('dealer'));
    }

    public function show(Vehicle $vehicle): VehicleResource
    {
        Gate::authorize('view', $vehicle);

        return new VehicleResource($vehicle->load('dealer'));
    }

    public function update(VehicleRequest $request, Vehicle $vehicle): VehicleResource
    {
        Gate::authorize('update', $vehicle);

        // Only super admins may move a vehicle between dealerships.
        $data = $request->validated();
        if (! $request->user()->isSuperAdmin()) {
            unset($data['dealer_id']);
        }

        $vehicle->update($data);

        return new VehicleResource($vehicle->load('dealer'));
    }

    /**
     * Soft-deletes, so past bookings keep pointing at the vehicle.
     */
    public function destroy(Vehicle $vehicle): Response
    {
        Gate::authorize('delete', $vehicle);

        abort_if(
            $vehicle->bookings()->whereIn('status', BookingStatus::blocking())->exists(),
            422,
            'This vehicle has upcoming or active bookings. Cancel or complete them first.',
        );

        $vehicle->delete();
        AuditLog::record('vehicle.deleted', "Removed vehicle {$vehicle->plate} ({$vehicle->model})", $vehicle, 'warning');

        return response()->noContent();
    }
}
