<?php

namespace App\Notifications\Channels;

use App\Services\Sms\SmsSender;
use App\Support\PhoneNumber;
use Illuminate\Notifications\Notification;

/**
 * Notification channel for text messages. Notifications opt in by listing
 * SmsChannel::class in via() and implementing toSms().
 */
class SmsChannel
{
    public function __construct(private SmsSender $sender) {}

    public function send(object $notifiable, Notification $notification): void
    {
        $to = PhoneNumber::toE164($notifiable->routeNotificationFor('sms', $notification));
        if ($to === null || ! method_exists($notification, 'toSms')) {
            return;
        }
        $this->sender->send($to, $notification->toSms($notifiable));
    }
}
