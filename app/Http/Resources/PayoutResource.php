<?php

namespace App\Http\Resources;

use App\Models\Payout;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payout */
class PayoutResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'dealer' => new DealerSummaryResource($this->whenLoaded('dealer')),
            'period_start' => $this->period_start->toDateString(),
            'period_end' => $this->period_end->toDateString(),
            'payment_count' => $this->payment_count,
            'gross_collected' => $this->gross_collected,
            'cash_collected' => $this->cash_collected,
            'commission' => $this->commission,
            'net' => $this->net,
            'status' => $this->status->value,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'transfer_reference' => $this->transfer_reference,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
