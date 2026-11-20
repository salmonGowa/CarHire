<?php

namespace App\Support;

/**
 * Loyalty tiers by lifetime paid value (KSh), shared by the admin client
 * screens and the customer's Rewards page.
 */
final class CustomerTier
{
    public const TIERS = [500000 => 'Platinum', 150000 => 'Gold', 50000 => 'Silver', 0 => 'Bronze'];

    public static function for(int $lifetimeValue): string
    {
        return collect(self::TIERS)->first(fn ($name, $min) => $lifetimeValue >= $min);
    }

    /** @return array{name: string, threshold: int}|null */
    public static function next(int $lifetimeValue): ?array
    {
        $next = collect(self::TIERS)->sortKeys()->first(fn ($name, $min) => $min > $lifetimeValue);

        return $next ? ['name' => $next, 'threshold' => array_search($next, self::TIERS, true)] : null;
    }
}
