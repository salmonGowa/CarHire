<?php

namespace App\Http\Resources;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Invoice */
class InvoiceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status(),
            'issued_at' => $this->issued_at->toIso8601String(),
            'customer_name' => $this->customer_name,
            'subtotal' => $this->subtotal,
            'vat' => $this->vat,
            'total' => $this->total,
            'amount_paid' => $this->amount_paid,
            'balance' => $this->balance(),
            'booking' => $this->whenLoaded('booking', fn () => [
                'id' => $this->booking->id,
                'reference' => $this->booking->reference,
                'status' => $this->booking->status->value,
                'days' => $this->booking->days,
                'daily_rate' => $this->booking->daily_rate,
                'pickup_at' => $this->booking->pickup_at->toIso8601String(),
                'return_at' => $this->booking->return_at->toIso8601String(),
                'customer_phone' => $this->booking->customer_phone,
                'customer_email' => $this->booking->customer_email,
                'vehicle' => $this->booking->relationLoaded('vehicle') && $this->booking->vehicle
                    ? ['model' => $this->booking->vehicle->model, 'plate' => $this->booking->vehicle->plate]
                    : null,
                // Return charges (late, fuel, mileage, damage), billed on top of the rental.
                'charges' => $this->booking->relationLoaded('charges')
                    ? $this->booking->charges->map(fn ($c) => $c->only(['id', 'type', 'description', 'amount', 'vat', 'total']))->values()
                    : [],
                'extension_days' => $this->booking->relationLoaded('extensions') ? (int) $this->booking->extensions->where('status', 'approved')->sum('extra_days') : 0,
            ]),
            // Seller details printed on the tax invoice.
            'dealer' => $this->whenLoaded('dealer', fn () => [
                'id' => $this->dealer->id,
                'name' => $this->dealer->name,
                'city' => $this->dealer->city,
                'address' => $this->dealer->address,
                'phone' => $this->dealer->phone,
                'email' => $this->dealer->email,
                'tax_pin' => $this->dealer->tax_pin,
            ]),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'can_record_payment' => $this->relationLoaded('booking') && ($request->user()?->can('recordPayment', $this->booking) ?? false),
        ];
    }
}
