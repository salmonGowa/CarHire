<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['booking_id', 'type', 'description', 'amount', 'vat', 'total', 'created_by'])]
class BookingCharge extends Model
{
    public const TYPES = ['late' => 'Late return', 'fuel' => 'Fuel', 'mileage' => 'Extra mileage', 'damage' => 'Damage', 'other' => 'Other'];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'vat' => 'integer', 'total' => 'integer'];
    }
}
