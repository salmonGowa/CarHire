<?php

namespace App\Http\Resources;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Vehicle */
class VehicleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'model' => $this->model,
            'plate' => $this->plate,
            'type' => $this->type,
            'year' => $this->year,
            'seats' => $this->seats,
            'transmission' => $this->transmission,
            'fuel_type' => $this->fuel_type,
            'daily_rate' => $this->daily_rate,
            'mileage' => $this->mileage,
            'fuel_level' => $this->fuel_level,
            'status' => $this->status->value,
            'location' => $this->location,
            'image_url' => $this->image_url,
            'dealer' => new DealerSummaryResource($this->whenLoaded('dealer')),
            'is_saved' => $this->when(isset($this->is_saved), fn () => (bool) $this->is_saved),
            // Average customer rating, when the query loaded it (catalogue).
            'rating' => $this->when(
                array_key_exists('bookings_avg_rating', $this->resource->getAttributes()),
                fn () => $this->bookings_avg_rating !== null ? round((float) $this->bookings_avg_rating, 1) : null,
            ),
        ];
    }
}
