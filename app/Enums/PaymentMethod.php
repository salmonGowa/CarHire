<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Mpesa = 'mpesa';
    case Card = 'card';
    case Bank = 'bank';
    case Cash = 'cash';

    /**
     * Cash is taken at the dealer's counter, so the platform never holds it.
     */
    public function collectedByPlatform(): bool
    {
        return $this !== self::Cash;
    }
}
