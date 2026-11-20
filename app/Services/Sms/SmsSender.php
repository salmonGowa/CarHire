<?php

namespace App\Services\Sms;

interface SmsSender
{
    /**
     * Send one text message. Throws if the provider refuses it.
     *
     * @param  string  $to  E.164 number, e.g. +254712345678
     */
    public function send(string $to, string $message): void;

    /** Human-readable name for logs and the Integrations page. */
    public function name(): string;
}
