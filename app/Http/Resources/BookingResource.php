<?php

namespace App\Http\Resources;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Booking */
class BookingResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'status' => $this->status->value,
            'is_overdue' => $this->isOverdue(),
            'customer' => [
                'id' => $this->customer_id,
                'name' => $this->customer_name,
                'email' => $this->customer_email,
                'phone' => $this->customer_phone,
                'id_number' => $this->customer_id_number,
            ],
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle->id,
                'model' => $this->vehicle->model,
                'plate' => $this->vehicle->plate,
                'type' => $this->vehicle->type,
                'image_url' => $this->vehicle->image_url,
            ]),
            'dealer' => new DealerSummaryResource($this->whenLoaded('dealer')),
            'pickup_at' => $this->pickup_at->toIso8601String(),
            'return_at' => $this->return_at->toIso8601String(),
            'pickup_location' => $this->pickup_location,
            'days' => $this->days,
            'daily_rate' => $this->daily_rate,
            'subtotal' => $this->subtotal,
            'vat' => $this->vat,
            'total' => $this->total,
            'payment_method' => $this->payment_method,
            'rating' => $this->rating,
            'review' => $this->review,
            'review_reply' => $this->review_reply,
            'discount' => $this->discount,
            'agreement_type' => $this->agreement_type,
            'agreement_signed' => $this->agreement_signed_at !== null,
            'created_at' => $this->created_at->toIso8601String(),
            // The status changes the current user may make, so the UI only shows valid actions.
            'allowed_transitions' => $user
                ? array_values(array_map(
                    fn (BookingStatus $s) => $s->value,
                    array_filter($this->status->allowedTransitions(), fn (BookingStatus $s) => $user->can('changeStatus', [$this->resource, $s])),
                ))
                : [],
            'can_rate' => $user?->can('rate', $this->resource) ?? false,
            // Customers can cancel themselves until this time (System Settings cut-off).
            'cancel_until' => $this->pickup_at->copy()->subHours((int) Settings::get('free_cancellation_hours'))->toIso8601String(),
            'invoice' => $this->whenLoaded('invoice', fn () => $this->invoice ? [
                'id' => $this->invoice->id,
                'number' => $this->invoice->number,
                'status' => $this->invoice->status(),
                'amount_paid' => $this->invoice->amount_paid,
                'balance' => $this->invoice->balance(),
            ] : null),
            'can_record_payment' => $user?->can('recordPayment', $this->resource) ?? false,
            'can_operate' => $user?->can('operate', $this->resource) ?? false,
            'can_request_extension' => $user?->can('requestExtension', $this->resource) ?? false,
            'deposit' => [
                'amount' => $this->deposit_amount,
                'received' => $this->deposit_received,
                'method' => $this->deposit_method,
                'applied' => $this->deposit_applied,
                'refunded' => $this->deposit_refunded,
                'held' => $this->depositHeld(),
                'settled_at' => $this->deposit_settled_at?->toIso8601String(),
            ],
            'picked_up_at' => $this->picked_up_at?->toIso8601String(),
            'returned_at' => $this->returned_at?->toIso8601String(),
            'charges' => $this->whenLoaded('charges', fn () => $this->charges->map(fn ($c) => $c->only(['id', 'type', 'description', 'amount', 'vat', 'total']))),
            'inspections' => $this->whenLoaded('inspections', fn () => $this->inspections->mapWithKeys(fn ($i) => [$i->type => [
                'id' => $i->id, 'odometer' => $i->odometer, 'fuel_level' => $i->fuel_level, 'notes' => $i->notes,
                'photos' => count($i->photos ?? []), 'at' => $i->created_at->toIso8601String(),
            ]])),
            'extension' => $this->whenLoaded('extensions', fn () => ($e = $this->extensions->first()) ? [
                'id' => $e->id, 'status' => $e->status, 'to_return_at' => $e->to_return_at->toIso8601String(),
                'extra_days' => $e->extra_days, 'amount' => $e->amount, 'note' => $e->note,
            ] : null),
        ];
    }
}
