<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class SavedVehicleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $vehicles = $request->user()->savedVehicles()
            ->with('dealer')
            ->withAvg('bookings', 'rating')
            ->orderByPivot('created_at', 'desc')
            ->get()
            ->each(fn (Vehicle $v) => $v->setAttribute('is_saved', true));

        return VehicleResource::collection($vehicles);
    }

    public function store(Request $request, Vehicle $vehicle): Response
    {
        abort_unless(Vehicle::bookable()->whereKey($vehicle->id)->exists(), 404);

        $request->user()->savedVehicles()->syncWithoutDetaching([$vehicle->id]);

        return response()->noContent();
    }

    public function destroy(Request $request, Vehicle $vehicle): Response
    {
        $request->user()->savedVehicles()->detach($vehicle->id);

        return response()->noContent();
    }

    public function clear(Request $request): Response
    {
        $request->user()->savedVehicles()->detach();

        return response()->noContent();
    }
}
