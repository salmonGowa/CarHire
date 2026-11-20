<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

/**
 * Something a user should know about. Always shown under the bell in the app;
 * also emailed, and texted when time-sensitive, depending on the category and
 * the user's notification preferences.
 *
 * The in-app copy is stored immediately; email and SMS go through the queue so
 * a slow provider never holds up the request that triggered them.
 */
class PlatformNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** Categories and the customer preference that controls their email (null = always emailed). */
    public const EMAIL_PREFERENCE = [
        'booking' => 'email_bookings',
        'payment' => 'email_receipts',
        'support' => null,
        'account' => null,
        'compliance' => null,
    ];

    /**
     * @param  'success'|'info'|'warning'|'error'  $tone
     * @param  key-of<self::EMAIL_PREFERENCE>  $category
     * @param  bool  $sms  time-sensitive: also text it if the user allows SMS
     */
    public function __construct(
        public string $title,
        public string $body,
        public ?string $link = null,
        public string $tone = 'info',
        public string $category = 'account',
        public bool $sms = false,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($notifiable instanceof User) {
            $preference = self::EMAIL_PREFERENCE[$this->category] ?? null;
            if ($notifiable->email && ($preference === null || $notifiable->preference($preference, true))) {
                $channels[] = 'mail';
            }
            if ($this->sms && $notifiable->phone && $notifiable->preference('sms_reminders', true)) {
                $channels[] = SmsChannel::class;
            }
        } elseif ($this->sms) {
            // On-demand notifications (walk-in customers without an account) are SMS only.
            $channels = [SmsChannel::class];
        }

        return $channels;
    }

    /** The bell must update right away; only email and SMS wait for the queue. */
    public function viaConnections(): array
    {
        return ['database' => 'sync'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->greeting('Hi '.Str::before((string) ($notifiable->name ?? ''), ' ').',')
            ->line($this->body);
        if ($this->tone === 'error') {
            $mail->error();
        }
        if ($this->link) {
            $mail->action('Open DriveFleet', url($this->link));
        }

        return $mail->salutation('— The DriveFleet team');
    }

    public function toSms(object $notifiable): string
    {
        return Str::limit("DriveFleet: {$this->title}. {$this->body}", 300, '…');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return ['title' => $this->title, 'body' => $this->body, 'link' => $this->link, 'tone' => $this->tone, 'category' => $this->category];
    }
}
