<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * An in-app notification shown under the bell in the top bar. Email and SMS
 * aren't connected yet, so the database is the only channel.
 */
class PlatformNotification extends Notification
{
    use Queueable;

    /**
     * @param  'success'|'info'|'warning'|'error'  $tone
     */
    public function __construct(
        public string $title,
        public string $body,
        public ?string $link = null,
        public string $tone = 'info',
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return ['title' => $this->title, 'body' => $this->body, 'link' => $this->link, 'tone' => $this->tone];
    }
}
