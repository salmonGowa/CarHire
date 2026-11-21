<?php

namespace App\Services\Payments;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * A stand-in checkout for development and tests: the "provider page" is a
 * DriveFleet page with Pay and Decline buttons, and no money moves.
 */
class SimulatedCardGateway implements CardGateway
{
    public function name(): string
    {
        return 'simulate';
    }

    public function initialize(string $reference, int $amount, string $email, string $returnUrl): array
    {
        Cache::put("card.sim.{$reference}", ['amount' => $amount, 'status' => 'pending', 'return' => $returnUrl], now()->addHours(2));

        return ['authorization_url' => route('payments.card.simulate', $reference), 'checkout_id' => 'SIM-'.Str::random(12)];
    }

    /** What the customer chose on the simulated checkout page. */
    public static function choose(string $reference, bool $pay): void
    {
        $checkout = Cache::get("card.sim.{$reference}");
        if ($checkout) {
            Cache::put("card.sim.{$reference}", [...$checkout, 'status' => $pay ? 'succeeded' : 'failed'], now()->addHours(2));
        }
    }

    public static function returnUrl(string $reference): ?string
    {
        return Cache::get("card.sim.{$reference}")['return'] ?? null;
    }

    public function verify(string $reference): array
    {
        $checkout = Cache::get("card.sim.{$reference}");

        return [
            'status' => $checkout['status'] ?? 'pending',
            'amount' => $checkout['amount'] ?? null,
            'receipt' => ($checkout['status'] ?? null) === 'succeeded' ? 'SIMCARD'.Str::upper(substr(md5($reference), 0, 6)) : null,
            'result_desc' => match ($checkout['status'] ?? null) {
                'succeeded' => 'Approved (simulated)',
                'failed' => 'Declined (simulated)',
                default => null,
            },
        ];
    }

    public function verifyWebhook(string $payload, ?string $signature): bool
    {
        return false; // the simulator never sends webhooks
    }
}
