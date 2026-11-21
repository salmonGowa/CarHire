<?php

namespace App\Http\Resources;

use App\Models\OnlinePayment;
use App\Services\OnlinePayments;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OnlinePayment */
class OnlinePaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'provider' => $this->provider,
            'simulated' => $this->driver === 'simulate',
            'amount' => $this->amount,
            'phone' => OnlinePayments::maskPhone($this->phone),
            'status' => $this->status,
            'message' => $this->result_desc,
            'receipt' => $this->receipt,
            'booking' => $this->whenLoaded('booking', fn () => ['id' => $this->booking->id, 'reference' => $this->booking->reference]),
            'created_at' => $this->created_at->toIso8601String(),
            'expires_at' => $this->created_at->copy()->addMinutes(OnlinePayment::EXPIRES_AFTER_MINUTES[$this->provider] ?? 10)->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
        ];
    }
}
