<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $pickup = now()->addDays(fake()->numberBetween(1, 10))->setTime(10, 0);
        $return = (clone $pickup)->addDays(fake()->numberBetween(1, 5));

        return [
            'vehicle_id' => Vehicle::factory(),
            'dealer_id' => fn (array $attrs) => Vehicle::find($attrs['vehicle_id'])->dealer_id,
            'customer_name' => fake()->name(),
            'customer_phone' => '+254 7'.fake()->numerify('## ### ###'),
            'pickup_at' => $pickup,
            'return_at' => $return,
            'pickup_location' => 'Nairobi CBD',
            'status' => BookingStatus::Confirmed,
            ...Booking::quote(5000, $pickup, $return),
        ];
    }
}
