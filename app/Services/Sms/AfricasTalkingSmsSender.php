<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Africa's Talking bulk SMS API. Uses the sandbox when the username is "sandbox".
 */
class AfricasTalkingSmsSender implements SmsSender
{
    public function __construct(
        private string $username,
        private string $apiKey,
        private ?string $senderId = null,
    ) {}

    public function send(string $to, string $message): void
    {
        $host = $this->username === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';
        $response = Http::asForm()
            ->acceptJson()
            ->withHeaders(['apiKey' => $this->apiKey])
            ->timeout(15)
            ->post("https://{$host}/version1/messaging", array_filter([
                'username' => $this->username,
                'to' => $to,
                'message' => $message,
                'from' => $this->senderId,
            ]));

        $recipient = $response->json('SMSMessageData.Recipients.0');
        if ($response->failed() || ! $recipient || ! in_array($recipient['statusCode'] ?? null, [100, 101, 102], true)) {
            throw new RuntimeException("Africa's Talking refused SMS to {$to}: ".($recipient['status'] ?? $response->body()));
        }
    }

    public function name(): string
    {
        return "Africa's Talking".($this->username === 'sandbox' ? ' (sandbox)' : '');
    }
}
