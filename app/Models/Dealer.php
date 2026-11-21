<?php

namespace App\Models;

use App\Enums\DealerStatus;
use Database\Factories\DealerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'city', 'county', 'address', 'phone', 'email', 'website', 'status', 'tier', 'subscription_plan_id', 'license_no',
    'deposit_amount', 'late_grace_minutes', 'late_fee_percent', 'fuel_charge_per_percent', 'included_km_per_day', 'extra_km_rate', 'tax_pin', 'notes',
    'owner_name', 'owner_phone', 'owner_email', 'owner_national_id', 'manager_name', 'manager_phone', 'manager_email',
    'payout_method', 'payout_bank_name', 'payout_bank_branch', 'payout_account_name', 'payout_account_number',
    'payout_mpesa_type', 'payout_mpesa_number', 'payout_mpesa_account', 'payout_details_updated_at', 'payout_details_updated_by',
])]
class Dealer extends Model
{
    /** @use HasFactory<DealerFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => DealerStatus::class,
            'deposit_amount' => 'integer',
            'late_grace_minutes' => 'integer',
            'late_fee_percent' => 'integer',
            'fuel_charge_per_percent' => 'integer',
            'included_km_per_day' => 'integer',
            'extra_km_rate' => 'integer',
            'payout_details_updated_at' => 'datetime',
        ];
    }

    /** @return HasMany<Vehicle, $this> */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /** @return HasMany<User, $this> */
    public function staff(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** @return BelongsTo<SubscriptionPlan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    /** @return HasMany<DealerDocument, $this> */
    public function documents(): HasMany
    {
        return $this->hasMany(DealerDocument::class);
    }

    /** @return HasMany<SubscriptionCharge, $this> */
    public function subscriptionCharges(): HasMany
    {
        return $this->hasMany(SubscriptionCharge::class);
    }

    /** The rental terms customers agree to when they book with this dealer. */
    public function policy(): array
    {
        return [
            'deposit_amount' => $this->deposit_amount,
            'late_grace_minutes' => $this->late_grace_minutes,
            'late_fee_percent' => $this->late_fee_percent,
            'fuel_charge_per_percent' => $this->fuel_charge_per_percent,
            'included_km_per_day' => $this->included_km_per_day,
            'extra_km_rate' => $this->extra_km_rate,
        ];
    }

    /** Payouts to a newly changed account are held for a second look (account takeover is the usual fraud). */
    public const PAYOUT_DETAILS_COOLING_HOURS = 48;

    /**
     * Where payouts go. `$masked` hides all but the last digits, for staff who
     * may see but not change the details.
     *
     * @return array<string, mixed>|null
     */
    public function payoutDetails(bool $masked = false): ?array
    {
        if (! $this->payout_method) {
            return null;
        }
        $hide = fn (?string $v) => $masked && $v ? str_repeat('•', max(0, mb_strlen($v) - 4)).mb_substr($v, -4) : $v;

        return [
            'method' => $this->payout_method,
            'bank_name' => $this->payout_bank_name,
            'bank_branch' => $this->payout_bank_branch,
            'account_name' => $this->payout_account_name,
            'account_number' => $hide($this->payout_account_number),
            'mpesa_type' => $this->payout_mpesa_type,
            'mpesa_number' => $hide($this->payout_mpesa_number),
            'mpesa_account' => $this->payout_mpesa_account,
            'summary' => $this->payoutDestination($masked),
            'updated_at' => $this->payout_details_updated_at?->toIso8601String(),
            'recently_changed' => $this->payoutDetailsRecentlyChanged(),
        ];
    }

    /** One line for transfer instructions, e.g. "Equity Bank, Westlands · 0123456789 (Acme Ltd)". */
    public function payoutDestination(bool $masked = false): ?string
    {
        $last4 = fn (?string $v) => $masked && $v ? '••••'.mb_substr($v, -4) : $v;

        return match ($this->payout_method) {
            'bank' => trim("{$this->payout_bank_name}".($this->payout_bank_branch ? ", {$this->payout_bank_branch}" : ''))
                .' · '.$last4($this->payout_account_number)." ({$this->payout_account_name})",
            'mpesa' => match ($this->payout_mpesa_type) {
                'paybill' => "M-PESA Paybill {$this->payout_mpesa_number} · account {$this->payout_mpesa_account}",
                'till' => "M-PESA Till {$this->payout_mpesa_number}",
                default => 'M-PESA '.$last4($this->payout_mpesa_number),
            }." ({$this->payout_account_name})",
            default => null,
        };
    }

    public function payoutDetailsRecentlyChanged(): bool
    {
        return $this->payout_details_updated_at !== null
            && $this->payout_details_updated_at->gt(now()->subHours(self::PAYOUT_DETAILS_COOLING_HOURS));
    }

    /** Whether the dealer's plan leaves room for another staff login (null when it does, else the reason). */
    public function staffLimitReached(): ?string
    {
        $limit = $this->plan?->staff_limit;

        return $limit !== null && $this->staff()->count() >= $limit
            ? "The {$this->plan->name} plan allows {$limit} staff logins. Upgrade the plan to add more."
            : null;
    }

    /** Whether the dealer's plan leaves room for another vehicle. */
    public function canAddVehicle(): bool
    {
        $limit = $this->plan?->vehicle_limit;

        return $limit === null || $this->vehicles()->count() < $limit;
    }
}
