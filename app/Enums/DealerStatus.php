<?php

namespace App\Enums;

enum DealerStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Pending = 'pending';
}
