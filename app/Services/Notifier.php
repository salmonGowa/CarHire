<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\PlatformNotification;
use Illuminate\Support\Facades\Notification;

/**
 * Sends notifications: in the app always, by email and SMS where the category
 * and the recipient's preferences allow (see PlatformNotification). Failures
 * never break the action that triggered them: a missing notification is better
 * than a failed booking.
 */
class Notifier
{
    /**
     * @param  key-of<PlatformNotification::EMAIL_PREFERENCE>  $category
     */
    public function user(?User $user, string $title, string $body, ?string $link = null, string $tone = 'info', string $category = 'account', bool $sms = false): void
    {
        if ($user && ! $user->isDisabled()) {
            $this->send([$user], new PlatformNotification($title, $body, $link, $tone, $category, $sms));
        }
    }

    /** Everyone with an active login at the dealership. */
    public function dealerStaff(?int $dealerId, string $title, string $body, ?string $link = null, string $tone = 'info', string $category = 'account'): void
    {
        if ($dealerId) {
            $this->send(User::where('dealer_id', $dealerId)->whereNull('disabled_at')->get(), new PlatformNotification($title, $body, $link, $tone, $category));
        }
    }

    /** A text to someone without an account (e.g. a walk-in customer's phone). */
    public function smsOnly(?string $phone, string $title, string $body): void
    {
        if ($phone) {
            try {
                Notification::route('sms', $phone)->notify(new PlatformNotification($title, $body, sms: true));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    /** @param iterable<User> $users */
    private function send(iterable $users, PlatformNotification $notification): void
    {
        try {
            Notification::send($users, $notification);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
