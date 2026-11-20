<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Mpesa = 'mpesa';
    case Card = 'card';
    case Bank = 'bank';
    case Cash = 'cash';
    // Part of a security deposit kept to cover return charges (the dealer already holds it).
    case Deposit = 'deposit';

    /**
     * Cash is taken at the dealer's counter and deposits are held by the dealer,
     * so the platform never holds either.
     */
    public function collectedByPlatform(): bool
    {
        return $this !== self::Cash && $this !== self::Deposit;
    }
}
