<?php

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $staff = $user && ($user->isSuperAdmin() || $user->isDealer());

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'amount' => $this->amount,
            'method' => $this->method->value,
            'transaction_code' => $this->transaction_code,
            'status' => $this->status->value,
            'paid_at' => $this->paid_at->toIso8601String(),
            'refunded_at' => $this->refunded_at?->toIso8601String(),
            // The fee split is the dealer's and platform's business, not the customer's.
            'vat' => $this->when($staff, $this->vat),
            'commission' => $this->when($staff, $this->commission),
            'dealer_net' => $this->when($staff, fn () => $this->dealerNet()),
            'settled' => $this->when($staff, fn () => $this->payout_id !== null),
            'booking' => $this->whenLoaded('booking', fn () => [
                'id' => $this->booking->id,
                'reference' => $this->booking->reference,
                'customer_name' => $this->booking->customer_name,
                'vehicle' => $this->booking->relationLoaded('vehicle') ? $this->booking->vehicle?->model : null,
            ]),
            'invoice_number' => $this->whenLoaded('invoice', fn () => $this->invoice->number),
            'dealer' => new DealerSummaryResource($this->whenLoaded('dealer')),
            'can_refund' => $user?->can('refund', $this->resource) ?? false,
        ];
    }
}
