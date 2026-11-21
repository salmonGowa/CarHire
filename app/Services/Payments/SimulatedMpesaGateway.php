<?php

namespace App\Services\Payments;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Pretends to be M-PESA for development and tests: no money moves. A prompt is
 * "approved" a few seconds after it is sent, except to numbers ending in 000
 * (cancelled on the phone) or 111 (not enough money), so both paths can be tried.
 */
class SimulatedMpesaGateway implements MpesaGateway
{
    public const APPROVE_AFTER_SECONDS = 3;

    public function name(): string
    {
        return 'simulate';
    }

    public function stkPush(string $phone, int $amount, string $accountReference, string $description): array
    {
        $id = 'ws_CO_SIM_'.Str::upper(Str::random(16));
        Cache::put("mpesa.sim.{$id}", ['phone' => $phone, 'amount' => $amount, 'at' => now()->getTimestamp()], now()->addHour());

        return ['checkout_id' => $id, 'merchant_request_id' => 'SIM-'.Str::random(8), 'message' => 'Simulated prompt sent (no money moves).'];
    }

    public function query(string $checkoutId): array
    {
        $prompt = Cache::get("mpesa.sim.{$checkoutId}");
        if (! $prompt || now()->getTimestamp() - $prompt['at'] < self::APPROVE_AFTER_SECONDS) {
            return ['status' => 'pending', 'result_code' => null, 'result_desc' => null, 'receipt' => null];
        }
        $code = match (true) {
            str_ends_with($prompt['phone'], '000') => '1032',
            str_ends_with($prompt['phone'], '111') => '1',
            default => '0',
        };

        return [
            'status' => MpesaResult::status($code),
            'result_code' => $code,
            'result_desc' => MpesaResult::message($code),
            // Stable per prompt so repeated checks agree.
            'receipt' => $code === '0' ? 'SIM'.Str::upper(substr(md5($checkoutId), 0, 7)) : null,
        ];
    }
}
