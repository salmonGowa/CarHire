<?php

namespace App\Services\Payments;

/**
 * Sends M-PESA STK push prompts ("Lipa na M-PESA Online") and checks on them.
 */
interface MpesaGateway
{
    /**
     * Ask the phone's owner to approve a payment with their M-PESA PIN.
     *
     * @param  string  $phone  2547XXXXXXXX
     * @return array{checkout_id: string, merchant_request_id: string|null, message: string}
     *
     * @throws PaymentGatewayException when the provider refuses the request
     */
    public function stkPush(string $phone, int $amount, string $accountReference, string $description): array;

    /**
     * Where a prompt has got to, for when the callback hasn't arrived.
     *
     * @return array{status: 'pending'|'succeeded'|'failed'|'cancelled', result_code: string|null, result_desc: string|null, receipt: string|null}
     */
    public function query(string $checkoutId): array;

    public function name(): string;
}
