<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\PlatformNotification;
use Illuminate\Support\Facades\Notification;

/**
 * Sends in-app notifications. Failures never break the action that triggered
 * them: a missing notification is better than a failed booking.
 */
class Notifier
{
    public function user(?User $user, string $title, string $body, ?string $link = null, string $tone = 'info'): void
    {
        if ($user && ! $user->isDisabled()) {
            $this->send([$user], $title, $body, $link, $tone);
        }
    }

    /** Everyone with an active login at the dealership. */
    public function dealerStaff(?int $dealerId, string $title, string $body, ?string $link = null, string $tone = 'info'): void
    {
        if ($dealerId) {
            $this->send(User::where('dealer_id', $dealerId)->whereNull('disabled_at')->get(), $title, $body, $link, $tone);
        }
    }

    /** @param iterable<User> $users */
    private function send(iterable $users, string $title, string $body, ?string $link, string $tone): void
    {
        try {
            Notification::send($users, new PlatformNotification($title, $body, $link, $tone));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
