<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'superadmin';
    case Hr = 'hr';
    case Dealer = 'dealer';
    case Customer = 'customer';

    /**
     * Roles a visitor may pick when creating their own account.
     *
     * @return list<self>
     */
    public static function selfRegisterable(): array
    {
        return [self::Customer, self::Dealer];
    }
}
