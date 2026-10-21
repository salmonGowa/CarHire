<?php

namespace Database\Factories;

use App\Enums\DealerStatus;
use App\Models\Dealer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Dealer>
 */
class DealerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Car Hire',
            'city' => fake()->randomElement(['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']),
            'phone' => '+254 7'.fake()->numerify('## ### ###'),
            'email' => fake()->unique()->companyEmail(),
            'status' => DealerStatus::Active,
            'tier' => fake()->randomElement(['silver', 'gold', 'platinum']),
        ];
    }

    public function suspended(): static
    {
        return $this->state(['status' => DealerStatus::Suspended]);
    }
}
