<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\PlatformAlerts;
use App\Services\Sms\LogSmsSender;
use App\Services\Sms\SmsSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * What the platform is actually connected to. Infrastructure is checked live;
 * third-party services that haven't been built say so instead of pretending.
 */
class IntegrationsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [...$this->infrastructure(), ...$this->services()]]);
    }

    /** @return list<array<string, mixed>> */
    private function infrastructure(): array
    {
        $db = $this->probe(fn () => DB::select('select 1'));
        $storage = $this->probe(function () {
            Storage::disk('local')->put('.healthcheck', (string) now());
            Storage::disk('local')->delete('.healthcheck');
        });
        $heartbeat = Cache::get(PlatformAlerts::SCHEDULER_HEARTBEAT);
        $schedulerOk = $heartbeat !== null && now()->diffInMinutes($heartbeat) <= 10;
        $mailer = (string) config('mail.default');

        return [
            $this->row('database', 'Database', 'Infrastructure', $db['ok'] ? 'connected' : 'error',
                $db['ok'] ? match ($driver = (string) config('database.default')) {
                    'mysql' => 'MySQL', 'pgsql' => 'PostgreSQL', 'sqlite' => 'SQLite', default => ucfirst($driver)
                }.' connection is healthy.' : "Can't reach the database: {$db['error']}", $db['ms']),
            $this->row('storage', 'Private file storage', 'Infrastructure', $storage['ok'] ? 'connected' : 'error',
                $storage['ok'] ? 'Dealer, employee and compliance documents are stored here and can be written.' : "Storage isn't writable: {$storage['error']}", $storage['ms']),
            $this->row('scheduler', 'Task scheduler', 'Infrastructure', $schedulerOk ? 'connected' : 'attention',
                $schedulerOk ? 'Running. Last check-in '.$heartbeat->diffForHumans().'.'
                    : 'Not running. Start `php artisan schedule:work` (or a cron entry for `schedule:run`) so monthly billing runs on its own.'),
            $this->row('mail', 'Email delivery', 'Communications', in_array($mailer, ['log', 'array'], true) ? 'attention' : 'configured',
                in_array($mailer, ['log', 'array'], true)
                    ? "The mailer is \"{$mailer}\": confirmations, receipts, reminders and password resets are written to the log, not delivered. Set MAIL_MAILER to a real provider."
                    : "Sending with \"{$mailer}\" from ".config('mail.from.address').'.'),
            $this->sms(),
            $this->queue(),
            $this->row('maps', 'Google Maps', 'Location', config('drivefleet.google_maps_key_set') ? 'configured' : 'not_connected',
                config('drivefleet.google_maps_key_set') ? 'A browser key is set and used by the Live Tracking map.' : 'No key set (VITE_GOOGLE_MAPS_API_KEY). The Live Tracking map will be blank.'),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function services(): array
    {
        return [
            $this->row('mpesa', 'M-PESA (Daraja)', 'Payments', 'not_connected', 'STK push and C2B confirmations are not built. Staff record M-PESA payments by hand with the transaction code.'),
            $this->row('card', 'Card payments', 'Payments', 'not_connected', 'No card gateway is connected. Card payments are recorded by hand.'),
            $this->row('etims', 'KRA eTIMS', 'Tax', 'not_connected', 'Invoices are numbered and include VAT but are not submitted to KRA.'),
            $this->row('gps', 'GPS telematics', 'Location', 'not_connected', 'No tracking provider. Live Tracking shows demo positions only.'),
        ];
    }

    /** @return array<string, mixed> */
    private function sms(): array
    {
        $sender = app(SmsSender::class);
        if ($sender instanceof LogSmsSender) {
            return $this->row('sms', 'SMS', 'Communications', 'attention',
                'Texts (pickup and return reminders, overdue alerts, booking confirmations) are written to the log. Set SMS_DRIVER=africastalking with your Africa\'s Talking keys to send them.');
        }
        $missing = blank(config('services.africastalking.username')) || blank(config('services.africastalking.api_key'));

        return $this->row('sms', 'SMS', 'Communications', $missing ? 'error' : 'configured',
            $missing ? 'SMS_DRIVER is africastalking but the username or API key is missing.' : "Sending with {$sender->name()}.");
    }

    /** @return array<string, mixed> */
    private function queue(): array
    {
        $connection = (string) config('queue.default');
        if ($connection === 'sync') {
            return $this->row('queue', 'Background jobs', 'Infrastructure', 'configured',
                'QUEUE_CONNECTION is sync: emails and texts are sent while the request waits. Fine for development; use a queue in production.');
        }
        $pending = $connection === 'database' ? DB::table('jobs')->count() : null;
        $failed = DB::table('failed_jobs')->count();
        $stuck = $connection === 'database' && DB::table('jobs')->where('created_at', '<', now()->subMinutes(10)->getTimestamp())->exists();

        return $this->row('queue', 'Background jobs', 'Infrastructure', $failed > 0 || $stuck ? 'attention' : 'connected',
            ($stuck ? 'Jobs have waited over 10 minutes; is `php artisan queue:work` running? ' : '')
            .($pending !== null ? "{$pending} waiting" : "Queue \"{$connection}\"").", {$failed} failed"
            .($failed ? ' (see `php artisan queue:failed`).' : '.'));
    }

    /** @return array{ok: bool, error: string|null, ms: int} */
    private function probe(callable $check): array
    {
        $start = microtime(true);
        try {
            $check();

            return ['ok' => true, 'error' => null, 'ms' => (int) round((microtime(true) - $start) * 1000)];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage(), 'ms' => (int) round((microtime(true) - $start) * 1000)];
        }
    }

    /** @return array<string, mixed> */
    private function row(string $id, string $name, string $category, string $status, string $detail, ?int $latencyMs = null): array
    {
        return ['id' => $id, 'name' => $name, 'category' => $category, 'status' => $status, 'detail' => $detail, 'latency_ms' => $latencyMs];
    }
}
