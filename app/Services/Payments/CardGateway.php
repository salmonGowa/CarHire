<?php

namespace App\Services\Payments;

/**
 * A hosted card checkout: the customer is sent to the provider's page to enter
 * card details, so DriveFleet never sees or stores them.
 */
interface CardGateway
{
    /**
     * @return array{authorization_url: string, checkout_id: string|null}
     *
     * @throws PaymentGatewayException
     */
    public function initialize(string $reference, int $amount, string $email, string $returnUrl): array;

    /**
     * @return array{status: 'pending'|'succeeded'|'failed'|'cancelled', amount: int|null, receipt: string|null, result_desc: string|null}
     *
     * @throws PaymentGatewayException
     */
    public function verify(string $reference): array;

    /** Whether a webhook body really came from the provider. */
    public function verifyWebhook(string $payload, ?string $signature): bool;

    public function name(): string;
}
