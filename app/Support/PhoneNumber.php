<?php

namespace App\Support;

/**
 * Kenyan mobile numbers in the international form SMS providers expect.
 */
final class PhoneNumber
{
    /** "0712 345 678", "254712345678" or "+254 712 345 678" → "+254712345678"; null if it isn't a Kenyan mobile. */
    public static function toE164(?string $number): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $number);

        return match (true) {
            (bool) preg_match('/^254([17]\d{8})$/', $digits, $m) => '+254'.$m[1],
            (bool) preg_match('/^0([17]\d{8})$/', $digits, $m) => '+254'.$m[1],
            (bool) preg_match('/^([17]\d{8})$/', $digits, $m) => '+254'.$m[1],
            default => null,
        };
    }
}
