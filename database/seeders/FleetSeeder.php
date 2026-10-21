<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\DealerStatus;
use App\Enums\UserRole;
use App\Enums\VehicleStatus;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\Driver;
use App\Models\Invoice;
use App\Models\MaintenanceTask;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\Promotion;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\FinanceService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Demo dealerships, fleets, customers and bookings in every state, dated
 * relative to today so dashboards and calendars always have current data.
 */
class FleetSeeder extends Seeder
{
    private const IMG = 'https://images.unsplash.com/photo-%s?auto=format&fit=crop&q=80&w=800';

    public function run(): void
    {
        $dealers = collect([
            ['name' => 'Swift Car Hire', 'city' => 'Nairobi', 'county' => 'Nairobi County', 'address' => 'Upper Hill, Mamlaka Road', 'phone' => '+254 703 456 789', 'email' => 'info@swiftcarhire.co.ke', 'tier' => 'gold', 'license_no' => 'KE-DLR-2023-0035', 'tax_pin' => 'P052345678Y'],
            ['name' => 'Premier Auto Group', 'city' => 'Mombasa', 'county' => 'Mombasa County', 'address' => 'Nyali Business Park, Links Road', 'phone' => '+254 712 345 678', 'email' => 'ops@premierauto.co.ke', 'tier' => 'platinum', 'license_no' => 'KE-DLR-2023-0041', 'tax_pin' => 'P051234567X'],
            ['name' => 'City Movers', 'city' => 'Nairobi', 'county' => 'Nairobi County', 'phone' => '+254 722 900 100', 'email' => 'hello@citymovers.co.ke', 'tier' => 'silver'],
            ['name' => 'Budget Wheels', 'city' => 'Kisumu', 'county' => 'Kisumu County', 'phone' => '+254 733 100 200', 'email' => 'book@budgetwheels.co.ke', 'tier' => 'silver'],
            ['name' => 'Luxe Drive', 'city' => 'Nakuru', 'county' => 'Nakuru County', 'phone' => '+254 711 222 333', 'email' => 'concierge@luxedrive.co.ke', 'tier' => 'gold'],
            ['name' => 'Rift Valley Motors', 'city' => 'Nakuru', 'county' => 'Nakuru County', 'phone' => '+254 720 789 012', 'email' => 'admin@riftmotors.co.ke', 'tier' => 'silver', 'status' => DealerStatus::Suspended, 'notes' => 'Suspended pending compliance review.'],
        ])->mapWithKeys(fn (array $d) => [$d['name'] => Dealer::updateOrCreate(['name' => $d['name']], $d + ['status' => DealerStatus::Active])]);

        // [dealer, model, plate, type, rate, seats, transmission, fuel, image id, status]
        $fleet = [
            ['Swift Car Hire', 'Toyota Land Cruiser Prado', 'KDK 123X', 'SUV', 15000, 7, 'auto', 'diesel', '1594502184342-2e12f877aa73'],
            ['Swift Car Hire', 'Mazda CX-5', 'KDH 999Y', 'SUV', 8500, 5, 'auto', 'petrol', '1568605117036-5fe5e7bab0b7'],
            ['Swift Car Hire', 'Honda Fit', 'KDG 444Z', 'Compact', 3500, 5, 'auto', 'hybrid', '1541899481282-d53bffe3c35d'],
            ['Swift Car Hire', 'Toyota Axio', 'KDF 111A', 'Sedan', 4000, 5, 'auto', 'petrol', '1590362891991-f776e747a588'],
            ['Swift Car Hire', 'Nissan X-Trail', 'KCZ 552B', 'SUV', 7000, 7, 'auto', 'petrol', '1609521263047-f8f205293f24', VehicleStatus::Maintenance],
            ['Premier Auto Group', 'Mercedes Benz C200', 'KDJ 808M', 'Luxury', 12000, 5, 'auto', 'petrol', '1618843479313-40f8afb4b4d8'],
            ['Premier Auto Group', 'Toyota Hiace', 'KCX 410V', 'Van', 9000, 14, 'manual', 'diesel', '1570125909232-eb263c188f7e'],
            ['Premier Auto Group', 'Subaru Forester', 'KDB 271F', 'SUV', 6500, 5, 'auto', 'petrol', '1533473359331-0135ef1b58bf'],
            ['City Movers', 'Toyota Camry', 'KCA 234X', 'Sedan', 4500, 5, 'auto', 'petrol', '1621007947382-bb3c3994e3fb'],
            ['City Movers', 'Volkswagen Tiguan', 'KDC 660T', 'SUV', 8500, 5, 'auto', 'diesel', '1559404225-b6d216f4eeb4'],
            ['Budget Wheels', 'Toyota Vitz', 'KCQ 118K', 'Compact', 2800, 5, 'auto', 'petrol', '1549399542-7e3f8b79c341'],
            ['Budget Wheels', 'Toyota Hilux', 'KDE 905P', 'Pickup', 7500, 5, 'manual', 'diesel', '1559416523-140ddc3d238c'],
            ['Luxe Drive', 'Range Rover Sport', 'KDL 001R', 'Luxury', 25000, 5, 'auto', 'petrol', '1606664515524-ed2f786a0bd6'],
            ['Luxe Drive', 'Toyota Land Cruiser V8', 'KDL 002R', 'SUV', 20000, 7, 'auto', 'petrol', '1519641471654-76ce0107ad1b'],
            ['Rift Valley Motors', 'Isuzu D-Max', 'KCT 377D', 'Pickup', 6000, 5, 'manual', 'diesel', '1612544448445-b8232cff3b6c'],
        ];

        $vehicles = collect($fleet)->mapWithKeys(function (array $v) use ($dealers) {
            [$dealer, $model, $plate, $type, $rate, $seats, $transmission, $fuel, $img] = $v;

            return [$plate => Vehicle::updateOrCreate(['plate' => $plate], [
                'dealer_id' => $dealers[$dealer]->id,
                'model' => $model,
                'type' => $type,
                'year' => 2019 + (crc32($plate) % 6),
                'seats' => $seats,
                'transmission' => $transmission,
                'fuel_type' => $fuel,
                'daily_rate' => $rate,
                'mileage' => 8000 + (crc32($plate) % 90000),
                'fuel_level' => 30 + (crc32($model) % 70),
                'status' => $v[9] ?? VehicleStatus::Available,
                'location' => $dealers[$dealer]->city,
                'image_url' => sprintf(self::IMG, $img),
            ])];
        });

        // Dealer staff and customers.
        User::where('email', 'dealer@drivefleet.test')->update(['dealer_id' => $dealers['Swift Car Hire']->id]);
        User::updateOrCreate(['email' => 'premier@drivefleet.test'], [
            'name' => 'Grace Wanjiku', 'password' => 'password', 'role' => UserRole::Dealer,
            'dealer_id' => $dealers['Premier Auto Group']->id, 'company' => 'Premier Auto Group', 'email_verified_at' => now(),
        ]);

        $customers = collect([
            ['James Mwangi', 'customer@drivefleet.test', '+254 712 345 678'],
            ['Sarah Wanjiku', 'sarah@example.com', '+254 722 111 222'],
            ['Michael Ochieng', 'michael@example.com', '+254 733 222 333'],
            ['Amina Hassan', 'amina@example.com', '+254 744 333 444'],
            ['David Kipkorir', 'david@example.com', '+254 755 444 555'],
        ])->map(fn (array $c) => User::updateOrCreate(['email' => $c[1]], [
            'name' => $c[0], 'phone' => $c[2], 'password' => 'password',
            'role' => UserRole::Customer, 'email_verified_at' => now(),
        ]));

        // Re-seeding replaces demo bookings (and their invoices/payments) rather than piling up duplicates.
        Payment::query()->delete();
        Payout::query()->delete();
        Invoice::query()->delete();
        Booking::query()->delete();
        MaintenanceTask::query()->delete();
        Driver::query()->delete();
        Promotion::query()->delete();

        $swift = $dealers['Swift Car Hire'];
        $premier = $dealers['Premier Auto Group'];

        $drivers = collect([
            [$swift, 'Alex Mutua', '+254 712 345 678', 'B, C1', '1500648767791-00dcc994a43e', -400],
            [$swift, 'Peter Njoroge', '+254 723 456 789', 'B, C1, D', '1506794778202-cad84cf45f1d', -700],
            [$swift, 'Faith Wairimu', '+254 734 567 890', 'B', '1494790108377-be9c29b29330', -120],
            [$premier, 'Hassan Omar', '+254 745 678 901', 'B, C1', '1507003211169-0a1dd7228f2d', -500],
        ])->map(fn (array $d) => Driver::create([
            'dealer_id' => $d[0]->id, 'name' => $d[1], 'phone' => $d[2], 'license_class' => $d[3],
            'license_number' => 'DL'.substr(md5($d[1]), 0, 7), 'license_expires_on' => now()->addYears(2)->toDateString(),
            'joined_on' => now()->addDays($d[5])->toDateString(),
            'photo_url' => sprintf(self::IMG, $d[4]),
        ]));

        $promo = fn (Dealer $dealer, string $code, string $type, int $value, ?int $max, int $expiresInDays, bool $active = true) => Promotion::create([
            'dealer_id' => $dealer->id, 'code' => $code, 'type' => $type, 'value' => $value,
            'max_uses' => $max, 'expires_on' => now()->addDays($expiresInDays)->toDateString(), 'is_active' => $active,
        ]);
        $promotions = [
            'WEEKEND20' => $promo($swift, 'WEEKEND20', 'percentage', 20, 100, 30),
            'NEWUSER5K' => $promo($swift, 'NEWUSER5K', 'flat', 5000, 50, 60),
            'FLASH10' => $promo($swift, 'FLASH10', 'percentage', 10, 100, -5),
            'VIP15' => $promo($swift, 'VIP15', 'percentage', 15, null, 90, false),
            'COAST10' => $promo($premier, 'COAST10', 'percentage', 10, 1, 45),
        ];
        $customers[0]->savedVehicles()->sync([$vehicles['KDL 001R']->id, $vehicles['KDC 660T']->id, $vehicles['KDL 002R']->id]);

        // [plate, customer index or walk-in name, days from today, length in days, status, rating]
        $bookings = [
            ['KDK 123X', 0, -2, 4, BookingStatus::Active],
            ['KDH 999Y', 1, 1, 2, BookingStatus::Confirmed],
            ['KDG 444Z', 'Peter Kamau', 2, 1, BookingStatus::Pending],
            ['KDF 111A', 2, -6, 2, BookingStatus::Completed, 4],
            ['KDF 111A', 0, -20, 3, BookingStatus::Completed, 5],
            ['KDH 999Y', 3, -10, 2, BookingStatus::Cancelled],
            ['KDJ 808M', 4, -1, 3, BookingStatus::Active],
            ['KCX 410V', 'Rose Akinyi', -5, 3, BookingStatus::Active], // overdue
            ['KDB 271F', 0, 5, 3, BookingStatus::Confirmed],
            ['KCA 234X', 1, -35, 2, BookingStatus::Completed, 5],
            ['KDC 660T', 2, 3, 4, BookingStatus::Pending],
            ['KCQ 118K', 3, -15, 5, BookingStatus::Completed, 3],
            ['KDE 905P', 'Joseph Mutua', 0, 2, BookingStatus::Confirmed],
            ['KDL 001R', 4, -50, 2, BookingStatus::Completed, 5],
            ['KDL 002R', 0, 10, 4, BookingStatus::Pending],
        ];

        $finance = app(FinanceService::class);
        $admin = User::where('email', 'superadmin@drivefleet.test')->first();

        // Which seeded bookings used a code, were chauffeured, or left a written review.
        $promoFor = ['KDF 111A-6' => 'WEEKEND20', 'KDH 999Y1' => 'NEWUSER5K', 'KDB 271F5' => 'COAST10'];
        $chauffeur = ['KDK 123X-2' => 0];
        $reviews = [
            'KDF 111A-6' => ['Clean car and a quick handover. Slight delay finding the branch.', 'Thanks Michael! We have added better signage at Upper Hill.'],
            'KDF 111A-20' => ['Perfect for city errands, very economical.', null],
            'KCA 234X-35' => ['Exceptional service, would rent again.', null],
            'KCQ 118K-15' => ['Car was fine but pickup took longer than expected.', null],
        ];

        foreach ($bookings as $b) {
            [$plate, $who, $offset, $length, $status] = $b;
            $key = $plate.$offset;
            $promotion = isset($promoFor[$key]) ? $promotions[$promoFor[$key]] : null;
            $vehicle = $vehicles[$plate];
            $customer = is_int($who) ? $customers[$who] : null;
            $pickup = Carbon::today()->addDays($offset)->setTime(10, 0);
            $return = (clone $pickup)->addDays($length);

            $booking = Booking::create([
                ...Booking::quote($vehicle->daily_rate, $pickup, $return, $promotion),
                'promotion_id' => $promotion?->id,
                'agreement_type' => isset($chauffeur[$key]) ? 'chauffeur' : 'self_drive',
                'driver_id' => isset($chauffeur[$key]) ? $drivers[$chauffeur[$key]]->id : null,
                // Agreements are signed at handover, so active and finished rentals have one.
                'agreement_signed_at' => in_array($status, [BookingStatus::Active, BookingStatus::Completed], true) ? $pickup : null,
                'review' => $reviews[$key][0] ?? null,
                'review_reply' => $reviews[$key][1] ?? null,
                'rated_at' => isset($b[5]) ? $return->copy()->addHours(6)->min(now()) : null,
                'replied_at' => isset($reviews[$key][1]) ? $return->copy()->addDay()->min(now()) : null,
                'dealer_id' => $vehicle->dealer_id,
                'vehicle_id' => $vehicle->id,
                'customer_id' => $customer?->id,
                'customer_name' => $customer?->name ?? $who,
                'customer_email' => $customer?->email,
                'customer_phone' => $customer?->phone ?? '+254 700 000 000',
                'customer_id_number' => $customer ? null : '2'.str_pad((string) (crc32($who) % 10000000), 7, '0'),
                'pickup_at' => $pickup,
                'return_at' => $return,
                'pickup_location' => $vehicle->location.' Branch',
                'payment_method' => ['mpesa', 'card', 'cash'][crc32($plate.$offset) % 3],
                'status' => $status,
                'rating' => $b[5] ?? null,
                'cancelled_at' => $status === BookingStatus::Cancelled ? $pickup->copy()->subDay() : null,
            ]);

            if ($status === BookingStatus::Active) {
                $vehicle->update(['status' => VehicleStatus::Rented]);
            }

            // Money: invoices for confirmed-onwards bookings; completed trips are paid in
            // full, active ones carry a deposit, some confirmed ones too.
            if (in_array($status, [BookingStatus::Confirmed, BookingStatus::Active, BookingStatus::Completed], true)) {
                $finance->issueInvoice($booking);
                $method = $booking->payment_method === 'cash' ? 'cash' : ($booking->payment_method === 'card' ? 'card' : 'mpesa');
                $amount = match ($status) {
                    BookingStatus::Completed => $booking->total,
                    BookingStatus::Active => (int) round($booking->total / 2, -2),
                    default => $offset > 2 ? (int) round($booking->total * 0.3, -2) : 0,
                };
                if ($amount > 0) {
                    $finance->recordPayment($admin, $booking, [
                        'amount' => $amount,
                        'method' => $method,
                        'transaction_code' => $method === 'mpesa' ? 'S'.strtoupper(substr(md5($booking->reference), 0, 9)) : null,
                        'paid_at' => $pickup->copy()->min(now())->toDateTimeString(),
                    ]);
                }
            }
        }

        // Workshop: one job in progress (the X-Trail is already in maintenance), some scheduled, history with costs.
        $task = fn (string $plate, string $service, int $dueIn, string $priority, string $status, ?int $cost = null) => MaintenanceTask::create([
            'dealer_id' => $vehicles[$plate]->dealer_id, 'vehicle_id' => $vehicles[$plate]->id, 'service' => $service,
            'due_date' => now()->addDays($dueIn)->toDateString(), 'priority' => $priority, 'status' => $status, 'cost' => $cost,
            'started_at' => $status !== 'scheduled' ? now()->addDays(min($dueIn, 0) - 1) : null,
            'completed_at' => $status === 'completed' ? now()->addDays($dueIn) : null,
        ]);
        $task('KCZ 552B', 'Gearbox inspection', -1, 'high', 'in_progress');
        $task('KDG 444Z', 'Oil & filter change', 3, 'medium', 'scheduled');
        $task('KDH 999Y', 'Brake pad replacement', 6, 'high', 'scheduled');
        $task('KDF 111A', 'Tyre rotation', -2, 'low', 'scheduled');
        $task('KDK 123X', 'Annual service', -9, 'medium', 'completed', 18500);
        $task('KDG 444Z', 'General inspection', -24, 'low', 'completed', 4500);
        $task('KDJ 808M', 'Windscreen replacement', 12, 'medium', 'scheduled');

        // One settled payout cycle for everything paid more than two weeks ago.
        foreach ($finance->generatePayouts($admin, now()->subDays(14)) as $payout) {
            $finance->markPaid($payout, 'BANK-'.strtoupper(substr(md5($payout->reference), 0, 8)));
            $payout->update(['paid_at' => now()->subDays(12)]);
        }
    }
}
