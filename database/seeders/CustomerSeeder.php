<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserDocument;
use App\Notifications\PlatformNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Customer account data: licences, preferences, KYC uploads and some
 * notifications so the bell isn't empty on a fresh install.
 */
class CustomerSeeder extends Seeder
{
    use MakesPlaceholderPdf;

    public function run(): void
    {
        DB::table('notifications')->delete();
        UserDocument::query()->delete();
        Storage::disk('local')->deleteDirectory('customer-documents');

        $user = fn (string $email) => User::where('email', $email)->first();

        $user('customer@drivefleet.test')?->update([
            'licence_number' => 'DL-4471209', 'licence_expires_on' => today()->addYears(2),
            'preferences' => ['preferred_vehicle_types' => ['SUV'], 'default_pickup_location' => 'Westlands', 'mpesa_phone' => '0712345678', 'marketing' => true],
        ]);
        $user('michael@example.com')?->update(['licence_number' => 'DL-5538817', 'licence_expires_on' => today()->addMonths(5)]);
        $user('david@example.com')?->update(['licence_number' => 'DL-2290144', 'licence_expires_on' => today()->subMonth()]);

        // Michael is waiting for KYC review with his documents uploaded; James was verified with his.
        foreach (['michael@example.com' => ['id_front', 'driving_licence'], 'customer@drivefleet.test' => ['id_front', 'id_back', 'driving_licence']] as $email => $types) {
            $u = $user($email);
            foreach ($u ? $types : [] as $type) {
                $path = "customer-documents/{$u->id}/".uniqid().'.pdf';
                Storage::disk('local')->put($path, $this->placeholderPdf(UserDocument::TYPES[$type]." - {$u->name}"));
                $u->documents()->create(['type' => $type, 'path' => $path, 'original_name' => "{$type}.pdf", 'mime_type' => 'application/pdf', 'size' => Storage::disk('local')->size($path)]);
            }
        }

        $notify = function (?User $u, string $title, string $body, ?string $link, string $tone, int $hoursAgo, bool $read = false) {
            if (! $u) {
                return;
            }
            $u->notify(new PlatformNotification($title, $body, $link, $tone));
            $u->notifications()->latest()->first()->forceFill(['created_at' => now()->subHours($hoursAgo), 'read_at' => $read ? now()->subHours($hoursAgo - 1) : null])->save();
        };
        $james = $user('customer@drivefleet.test');
        $notify($james, 'Identity verified', 'Your ID has been checked. You can book any vehicle on DriveFleet.', '/customer-profile', 'success', 720, true);
        $notify($james, 'Booking confirmed', 'Your next trip is confirmed. See pickup details under Live Trip.', '/customer-active-trip', 'success', 20);
        $notify($user('dealer@drivefleet.test'), 'Document expiring soon', 'Your Comprehensive Insurance expires within 30 days. Upload the renewal under Plan & Compliance.', '/dealer-account', 'warning', 6);
        $notify($user('superadmin@drivefleet.test'), 'Urgent: Flat tyre on Mombasa Road', 'James Mwangi opened a roadside assistance ticket.', '/superadmin-support', 'error', 1);
    }
}
