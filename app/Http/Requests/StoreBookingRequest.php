<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    public const PAYMENT_METHODS = ['mpesa', 'card', 'cash', 'pay_later'];

    /** @return array<string, mixed> */
    public function rules(): array
    {
        // Staff book on behalf of a walk-in or phone-in client, so they supply
        // the client's details; customers book for themselves.
        $forClient = $this->user()->isDealer() || $this->user()->isSuperAdmin();

        return [
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'pickup_at' => ['required', 'date', 'after_or_equal:today'],
            'return_at' => ['required', 'date', 'after:pickup_at'],
            'pickup_location' => ['required', 'string', 'max:120'],
            'payment_method' => ['nullable', Rule::in(self::PAYMENT_METHODS)],
            'customer_name' => [Rule::requiredIf($forClient), 'nullable', 'string', 'max:255'],
            'customer_phone' => [Rule::requiredIf($forClient), 'nullable', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_id_number' => [Rule::requiredIf($forClient), 'nullable', 'string', 'max:50'],
            'promo_code' => ['nullable', 'string', 'max:40'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'pickup_at.after_or_equal' => 'Pickup must be today or later.',
            'return_at.after' => 'Return must be after pickup.',
        ];
    }
}
