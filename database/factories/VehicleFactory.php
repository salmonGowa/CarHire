<?php

namespace Database\Factories;

use App\Enums\VehicleStatus;
use App\Models\Dealer;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vehicle>
 */
class VehicleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'dealer_id' => Dealer::factory(),
            'model' => fake()->randomElement(['Toyota Axio', 'Mazda CX-5', 'Honda Fit', 'Nissan X-Trail', 'Subaru Forester']),
            'plate' => 'K'.fake()->unique()->bothify('?? ###?'),
            'type' => fake()->randomElement(['SUV', 'Sedan', 'Compact']),
            'year' => fake()->numberBetween(2016, 2025),
            'seats' => 5,
            'transmission' => 'auto',
            'fuel_type' => 'petrol',
            'daily_rate' => fake()->randomElement([3500, 4500, 6000, 8500, 12000]),
            'mileage' => fake()->numberBetween(5000, 120000),
            'fuel_level' => fake()->numberBetween(20, 100),
            'status' => VehicleStatus::Available,
        ];
    }

    public function maintenance(): static
    {
        return $this->state(['status' => VehicleStatus::Maintenance]);
    }
}
