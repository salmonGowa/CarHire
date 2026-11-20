<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

/**
 * Development driver: writes messages to the log instead of sending them.
 */
class LogSmsSender implements SmsSender
{
    public function send(string $to, string $message): void
    {
        Log::info("SMS to {$to}: {$message}");
    }

    public function name(): string
    {
        return 'log';
    }
}
