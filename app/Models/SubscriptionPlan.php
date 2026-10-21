<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'monthly_fee', 'vehicle_limit', 'staff_limit', 'description', 'sort_order'])]
class SubscriptionPlan extends Model
{
    protected function casts(): array
    {
        return ['monthly_fee' => 'integer', 'vehicle_limit' => 'integer', 'staff_limit' => 'integer'];
    }

    /** @return HasMany<Dealer, $this> */
    public function dealers(): HasMany
    {
        return $this->hasMany(Dealer::class);
    }
}
