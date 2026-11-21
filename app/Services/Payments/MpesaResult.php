<?php

namespace App\Services\Payments;

/**
 * Daraja STK result codes, mapped to an outcome and words a customer understands.
 */
final class MpesaResult
{
    private const MESSAGES = [
        '0' => 'Payment received.',
        '1' => "There isn't enough money in that M-PESA account.",
        '1001' => 'Another M-PESA transaction is in progress on that phone. Try again in a minute.',
        '1019' => 'The prompt expired before it was answered.',
        '1025' => 'M-PESA could not send the prompt. Try again.',
        '1032' => 'The M-PESA prompt was cancelled on the phone.',
        '1037' => "The phone didn't respond. Check it is on and has signal, then try again.",
        '2001' => 'The M-PESA PIN was wrong.',
        '9999' => 'M-PESA could not send the prompt. Try again.',
    ];

    /** @return 'succeeded'|'failed'|'cancelled' */
    public static function status(string|int $code): string
    {
        return match ((string) $code) {
            '0' => 'succeeded',
            '1032' => 'cancelled',
            default => 'failed',
        };
    }

    public static function message(string|int|null $code, ?string $fallback = null): string
    {
        return self::MESSAGES[(string) $code] ?? ($fallback ?: 'The M-PESA payment did not go through.');
    }
}
