<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable(['period', 'status', 'created_by', 'approved_at', 'approved_by', 'paid_at'])]
class PayrollRun extends Model
{
    protected function casts(): array
    {
        return ['approved_at' => 'datetime', 'paid_at' => 'datetime'];
    }

    /** @return HasMany<Payslip, $this> */
    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    public function periodStart(): Carbon
    {
        return Carbon::createFromFormat('Y-m-d', $this->period.'-01')->startOfDay();
    }
}
