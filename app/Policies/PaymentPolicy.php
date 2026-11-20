<?php

namespace App\Policies;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    /**
     * Staff may refund a completed payment until it is swept into a payout.
     */
    public function refund(User $user, Payment $payment): bool
    {
        $manages = $user->isSuperAdmin() || ($user->isDealer() && $user->dealer_id === $payment->dealer_id);

        // Deposit applications are reversed by settling the deposit, not refunded.
        return $manages && $payment->status === PaymentStatus::Completed && $payment->payout_id === null && $payment->method !== PaymentMethod::Deposit;
    }
}
