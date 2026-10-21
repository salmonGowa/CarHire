<?php

namespace App\Services;

use App\Enums\DealerStatus;
use App\Enums\PaymentMethod;
use App\Models\AuditLog;
use App\Models\Dealer;
use App\Models\SubscriptionCharge;
use App\Models\User;
use App\Support\Settings;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Monthly plan charges for dealers. Charges are raised in advance for the
 * calendar month at the dealer's current plan price; plan changes apply from
 * the next charge. Payments arrive outside the app (M-PESA, bank) and are
 * recorded here.
 */
class SubscriptionBilling
{
    /** Raise a charge for the month for every active dealer on a paid plan. Returns how many were created. */
    public function issue(CarbonInterface $month, ?User $actor = null): int
    {
        $start = $month->copy()->startOfMonth();
        $created = 0;

        Dealer::with('plan')
            ->where('status', DealerStatus::Active)
            ->whereHas('plan', fn ($q) => $q->where('monthly_fee', '>', 0))
            ->whereDoesntHave('subscriptionCharges', fn ($q) => $q->whereDate('period_start', $start))
            ->each(function (Dealer $dealer) use ($start, &$created) {
                SubscriptionCharge::create([
                    'dealer_id' => $dealer->id,
                    'subscription_plan_id' => $dealer->plan->id,
                    'plan_name' => $dealer->plan->name,
                    'amount' => $dealer->plan->monthly_fee,
                    'period_start' => $start,
                    'period_end' => $start->copy()->endOfMonth(),
                    'due_on' => $start->copy()->addDays((int) Settings::get('subscription_due_days')),
                ]);
                $created++;
            });

        if ($created > 0) {
            AuditLog::record('subscriptions.issued', "Issued {$created} subscription charges for {$start->format('F Y')}", actor: $actor);
        }

        return $created;
    }

    public function recordPayment(SubscriptionCharge $charge, PaymentMethod $method, ?string $reference, User $actor): SubscriptionCharge
    {
        return DB::transaction(function () use ($charge, $method, $reference, $actor) {
            $charge = SubscriptionCharge::lockForUpdate()->findOrFail($charge->id);
            if ($charge->status !== 'pending') {
                throw ValidationException::withMessages(['charge' => "This charge is already {$charge->status}."]);
            }
            $charge->update([
                'status' => 'paid', 'method' => $method, 'transaction_ref' => $reference,
                'paid_at' => now(), 'recorded_by' => $actor->id,
            ]);
            AuditLog::record('subscription.paid', "Recorded {$charge->reference} payment of KSh ".number_format($charge->amount)." from {$charge->dealer->name}", $charge, actor: $actor);

            return $charge;
        });
    }

    public function void(SubscriptionCharge $charge, User $actor): SubscriptionCharge
    {
        if ($charge->status !== 'pending') {
            throw ValidationException::withMessages(['charge' => 'Only unpaid charges can be voided.']);
        }
        $charge->update(['status' => 'void', 'recorded_by' => $actor->id]);
        AuditLog::record('subscription.voided', "Voided {$charge->reference} for {$charge->dealer->name}", $charge, 'warning', $actor);

        return $charge;
    }
}
