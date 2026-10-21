<?php

namespace App\Http\Requests;

use App\Enums\VehicleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VehicleRequest extends FormRequest
{
    public const TYPES = ['SUV', 'Sedan', 'Compact', 'Luxury', 'Van', 'Pickup'];

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $vehicle = $this->route('vehicle');

        return [
            // Super admins choose the dealership; dealer staff always add to their own.
            'dealer_id' => [Rule::requiredIf(fn () => $this->user()->isSuperAdmin() && ! $vehicle), 'integer', 'exists:dealers,id'],
            'model' => ['required', 'string', 'max:120'],
            'plate' => ['required', 'string', 'max:20', Rule::unique('vehicles', 'plate')->ignore($vehicle)],
            'type' => ['required', Rule::in(self::TYPES)],
            'year' => ['nullable', 'integer', 'min:1990', 'max:'.(now()->year + 1)],
            'seats' => ['required', 'integer', 'min:1', 'max:60'],
            'transmission' => ['required', Rule::in(['auto', 'manual'])],
            'fuel_type' => ['required', Rule::in(['petrol', 'diesel', 'hybrid', 'electric'])],
            'daily_rate' => ['required', 'integer', 'min:100', 'max:1000000'],
            'mileage' => ['nullable', 'integer', 'min:0'],
            'fuel_level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['required', Rule::enum(VehicleStatus::class)],
            'location' => ['nullable', 'string', 'max:120'],
            'image_url' => ['nullable', 'url', 'max:2048'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('plate')) {
            $this->merge(['plate' => strtoupper(trim((string) $this->input('plate')))]);
        }
    }
}
