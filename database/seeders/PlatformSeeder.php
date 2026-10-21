<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\DealerDocument;
use App\Models\SubscriptionCharge;
use App\Models\SubscriptionPlan;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Platform operations: dealer plans and billing, compliance documents and
 * support tickets.
 */
class PlatformSeeder extends Seeder
{
    use MakesPlaceholderPdf;

    public function run(): void
    {
        SupportTicket::query()->delete();
        SubscriptionCharge::query()->delete();
        DealerDocument::query()->delete();
        Storage::disk('local')->deleteDirectory('dealer-documents');

        $admin = User::where('email', 'superadmin@drivefleet.test')->first();
        $grace = User::where('email', 'grace.o@drivefleet.ke')->first();
        $dealers = Dealer::all()->keyBy('name');

        // ── Plans and billing ─────────────────────────────────────────────
        $plans = collect([
            ['name' => 'Starter', 'monthly_fee' => 3000, 'vehicle_limit' => 5, 'staff_limit' => 2, 'sort_order' => 1, 'description' => 'Small fleets getting started.'],
            ['name' => 'Business', 'monthly_fee' => 9000, 'vehicle_limit' => 25, 'staff_limit' => 10, 'sort_order' => 2, 'description' => 'Growing dealerships with a team.'],
            ['name' => 'Enterprise', 'monthly_fee' => 25000, 'vehicle_limit' => null, 'staff_limit' => null, 'sort_order' => 3, 'description' => 'Unlimited vehicles and staff, priority support.'],
        ])->mapWithKeys(fn ($p) => [$p['name'] => SubscriptionPlan::updateOrCreate(['name' => $p['name']], $p)]);

        $assign = ['Swift Car Hire' => 'Business', 'Premier Auto Group' => 'Enterprise', 'City Movers' => 'Starter', 'Budget Wheels' => 'Starter', 'Luxe Drive' => 'Business', 'Rift Valley Motors' => 'Starter'];
        foreach ($assign as $dealer => $plan) {
            $dealers[$dealer]?->update(['subscription_plan_id' => $plans[$plan]->id]);
        }

        // Three months of charges; City Movers is two months behind and Luxe owes this month.
        $unpaid = ['City Movers' => [0, 1], 'Luxe Drive' => [0]];
        foreach ([2, 1, 0] as $monthsAgo) {
            $start = today()->startOfMonth()->subMonthsNoOverflow($monthsAgo);
            foreach ($assign as $name => $plan) {
                $dealer = $dealers[$name] ?? null;
                if (! $dealer || $name === 'Rift Valley Motors' && $monthsAgo === 0) {
                    continue; // suspended dealers aren't billed
                }
                $paid = ! in_array($monthsAgo, $unpaid[$name] ?? [], true);
                SubscriptionCharge::create([
                    'dealer_id' => $dealer->id, 'subscription_plan_id' => $plans[$plan]->id, 'plan_name' => $plan,
                    'amount' => $plans[$plan]->monthly_fee, 'period_start' => $start, 'period_end' => $start->copy()->endOfMonth(),
                    'due_on' => $start->copy()->addDays(7), 'status' => $paid ? 'paid' : 'pending',
                    'method' => $paid ? ($name === 'Premier Auto Group' ? PaymentMethod::Bank : PaymentMethod::Mpesa) : null,
                    'transaction_ref' => $paid ? strtoupper(substr(md5("{$name}{$monthsAgo}"), 0, 10)) : null,
                    'paid_at' => $paid ? $start->copy()->addDays(3)->setTime(10, 15) : null, 'recorded_by' => $paid ? $admin?->id : null,
                ]);
            }
        }

        // ── Compliance documents ──────────────────────────────────────────
        $doc = function (string $dealer, string $type, string $status, array $extra = []) use ($dealers, $admin) {
            $d = $dealers[$dealer] ?? null;
            if (! $d) {
                return;
            }
            $file = [];
            if ($status !== 'requested') {
                $path = "dealer-documents/{$d->id}/".uniqid().'.pdf';
                Storage::disk('local')->put($path, $this->placeholderPdf("{$type} - {$dealer}"));
                $file = ['path' => $path, 'original_name' => str_replace([' ', '/'], ['-', ''], strtolower($type)).'.pdf', 'mime_type' => 'application/pdf',
                    'size' => Storage::disk('local')->size($path), 'submitted_at' => now()->subDays($extra['age'] ?? 40)];
            }
            $reviewed = in_array($status, ['verified', 'rejected'], true) ? ['reviewed_by' => $admin?->id, 'reviewed_at' => now()->subDays(($extra['age'] ?? 40) - 2)] : [];
            DealerDocument::create([...$file, ...$reviewed, 'dealer_id' => $d->id, 'type' => $type, 'status' => $status, 'requested_by' => $admin?->id,
                ...collect($extra)->except('age')->all()]);
        };
        $years = fn (int $days) => today()->addDays($days);

        foreach (['KRA PIN Certificate', 'County Business Permit', 'NTSA PSV / Fleet Licence'] as $t) {
            $doc('Swift Car Hire', $t, 'verified', ['expires_on' => $t === 'KRA PIN Certificate' ? null : $years(200)]);
            $doc('Premier Auto Group', $t, 'verified', ['expires_on' => $t === 'KRA PIN Certificate' ? null : $years(300)]);
            $doc('Luxe Drive', $t, 'verified', ['expires_on' => match ($t) {
                'County Business Permit' => today()->subDays(9), 'KRA PIN Certificate' => null, default => $years(150)
            }]);
        }
        $doc('Swift Car Hire', 'Comprehensive Insurance', 'verified', ['expires_on' => $years(18), 'notes' => 'Policy covers the whole fleet.']);
        $doc('Premier Auto Group', 'Comprehensive Insurance', 'verified', ['expires_on' => $years(240)]);
        $doc('Premier Auto Group', 'Certificate of Incorporation', 'verified');
        $doc('Luxe Drive', 'Comprehensive Insurance', 'verified', ['expires_on' => $years(90)]);

        $doc('City Movers', 'KRA PIN Certificate', 'verified');
        $doc('City Movers', 'Comprehensive Insurance', 'verified', ['expires_on' => $years(120)]);
        $doc('City Movers', 'County Business Permit', 'submitted', ['age' => 2, 'expires_on' => $years(365)]);
        $doc('City Movers', 'NTSA PSV / Fleet Licence', 'requested', ['due_on' => today()->subDays(5), 'notes' => 'Your NTSA licence on file has lapsed. Upload the renewed licence.']);

        $doc('Budget Wheels', 'Comprehensive Insurance', 'verified', ['expires_on' => $years(60)]);
        $doc('Budget Wheels', 'KRA PIN Certificate', 'submitted', ['age' => 1]);
        $doc('Budget Wheels', 'County Business Permit', 'requested', ['due_on' => $years(10)]);

        $doc('Rift Valley Motors', 'Comprehensive Insurance', 'rejected', ['age' => 12, 'review_note' => 'Policy expired in August. Upload the current certificate.']);

        // ── Support tickets ───────────────────────────────────────────────
        $ticket = function (string $email, array $t, array $thread) {
            $user = User::where('email', $email)->first();
            if (! $user) {
                return;
            }
            $created = now()->subMinutes($t['age']);
            $ticket = SupportTicket::create([
                'user_id' => $user->id, 'dealer_id' => $user->dealer_id, 'booking_id' => $t['booking'] ?? null,
                'subject' => $t['subject'], 'category' => $t['category'], 'priority' => $t['priority'], 'status' => $t['status'],
                'assigned_to' => $t['assignee'] ?? null,
            ]);
            $at = $created->copy();
            $firstResponse = null;
            foreach ($thread as [$author, $body, $minutes, $internal]) {
                $at = $at->copy()->addMinutes($minutes);
                $message = $ticket->messages()->create(['user_id' => $author->id, 'body' => $body, 'internal' => $internal]);
                $message->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
                if ($author->isSuperAdmin() && ! $internal) {
                    $firstResponse ??= $at;
                }
            }
            $ticket->forceFill([
                'created_at' => $created, 'updated_at' => $at, 'last_activity_at' => $at, 'first_response_at' => $firstResponse,
                'resolved_at' => in_array($t['status'], ['resolved', 'closed'], true) ? $at : null,
            ])->saveQuietly();
        };
        $u = fn (string $email) => User::where('email', $email)->first();
        $james = $u('customer@drivefleet.test');
        $swiftDealer = $u('dealer@drivefleet.test');

        $ticket('customer@drivefleet.test', ['subject' => 'Flat tyre on Mombasa Road', 'category' => 'Roadside Assistance', 'priority' => 'urgent', 'status' => 'open', 'age' => 25,
            'booking' => Booking::where('customer_id', $james?->id)->latest('pickup_at')->value('id')],
            [[$james, 'Rear left tyre is flat near the Cabanas exit. There is a spare but no jack in the boot.', 0, false]]);
        $ticket('dealer@drivefleet.test', ['subject' => 'Payout for last cycle is lower than expected', 'category' => 'Payouts', 'priority' => 'high', 'status' => 'in_progress', 'age' => 60 * 26, 'assignee' => $grace?->id],
            [[$swiftDealer, 'Our last payout is about KSh 18,000 below what our bookings show. Can you send a breakdown?', 0, false],
                [$grace ?? $admin, 'Thanks, looking into it now. Cash bookings are paid at your counter, so they are not part of the payout; I will confirm the rest.', 75, false],
                [$grace ?? $admin, 'Two cash bookings explain KSh 15,400. Checking the remaining refund.', 20, true]]);
        $ticket('david@example.com', ['subject' => 'Dispute regarding late return fee', 'category' => 'Complaint', 'priority' => 'medium', 'status' => 'open', 'age' => 60 * 20],
            [[$u('david@example.com'), 'I was charged a late fee but I returned the car on time. The branch was closed when I arrived.', 0, false]]);
        $ticket('sarah@example.com', ['subject' => 'Receipt for my last booking', 'category' => 'Payment & Billing', 'priority' => 'low', 'status' => 'resolved', 'age' => 60 * 50, 'assignee' => $admin?->id],
            [[$u('sarah@example.com'), 'Could I get a receipt for my company expense claim?', 0, false],
                [$admin, 'Your invoice is under Billing in your account, with a Download button. Let us know if you need anything else.', 40, false],
                [$u('sarah@example.com'), 'Found it, thank you!', 15, false]]);
        $ticket('premier@drivefleet.test', ['subject' => 'Update account banking details', 'category' => 'Account', 'priority' => 'low', 'status' => 'closed', 'age' => 60 * 75, 'assignee' => $admin?->id],
            [[$u('premier@drivefleet.test'), 'We have moved to a new bank. Please update our payout account.', 0, false],
                [$admin, 'Done. The next payout will go to the new account.', 180, false]]);
    }
}
