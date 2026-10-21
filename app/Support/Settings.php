<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Platform settings that super admins change from the System Settings page.
 * Every key has a default here, so a fresh install (or a test) behaves the
 * same as before anything was saved.
 */
final class Settings
{
    private const CACHE_KEY = 'platform-settings';

    /** @var array<string, mixed>|null */
    private static ?array $loaded = null;

    /**
     * @return array<string, array{default: mixed, rules: array<int, mixed>, label: string, sensitive?: bool}>
     */
    public static function definitions(): array
    {
        return [
            'commission_rate' => ['default' => (float) config('drivefleet.commission_rate'), 'rules' => ['numeric', 'min:0', 'max:0.5'], 'label' => 'Platform commission', 'sensitive' => true],
            'subscription_due_days' => ['default' => (int) config('drivefleet.subscription_due_days'), 'rules' => ['integer', 'min:1', 'max:60'], 'label' => 'Subscription payment terms'],
            'min_booking_hours' => ['default' => 4, 'rules' => ['integer', 'min:1', 'max:72'], 'label' => 'Minimum booking length'],
            'max_booking_days' => ['default' => 30, 'rules' => ['integer', 'min:1', 'max:365'], 'label' => 'Maximum booking length'],
            'free_cancellation_hours' => ['default' => 24, 'rules' => ['integer', 'min:0', 'max:168'], 'label' => 'Customer cancellation cut-off'],
            'min_driver_age' => ['default' => 21, 'rules' => ['integer', 'min:18', 'max:30'], 'label' => 'Minimum driver age'],
            'customer_registration' => ['default' => true, 'rules' => ['boolean'], 'label' => 'Customer sign-up'],
            'dealer_registration' => ['default' => true, 'rules' => ['boolean'], 'label' => 'Dealer sign-up'],
            'maintenance_mode' => ['default' => false, 'rules' => ['boolean'], 'label' => 'Maintenance mode', 'sensitive' => true],
            'maintenance_message' => ['default' => 'DriveFleet is down for scheduled maintenance. Please check back shortly.', 'rules' => ['string', 'max:300'], 'label' => 'Maintenance message'],
            'login_attempts_per_minute' => ['default' => 5, 'rules' => ['integer', 'min:3', 'max:20'], 'label' => 'Sign-in attempts per minute'],
            'session_lifetime_minutes' => ['default' => (int) config('session.lifetime'), 'rules' => ['integer', 'min:15', 'max:1440'], 'label' => 'Idle sign-out'],
            'support_email' => ['default' => null, 'rules' => ['nullable', 'email', 'max:255'], 'label' => 'Support email'],
            'support_phone' => ['default' => null, 'rules' => ['nullable', 'string', 'max:30'], 'label' => 'Support phone'],
        ];
    }

    /** @return array<string, mixed> */
    public static function all(): array
    {
        if (self::$loaded !== null) {
            return self::$loaded;
        }
        $defaults = array_map(fn (array $d) => $d['default'], self::definitions());

        try {
            $stored = Cache::rememberForever(self::CACHE_KEY, fn () => DB::table('settings')->pluck('value', 'key')
                ->map(fn (string $json) => json_decode($json, true))->all());
        } catch (QueryException) {
            $stored = []; // table not migrated yet
        }

        return self::$loaded = array_merge($defaults, array_intersect_key($stored, $defaults));
    }

    /**
     * The settings every visitor's browser may know about (rendered into the page).
     *
     * @return array<string, mixed>
     */
    public static function public(): array
    {
        return array_intersect_key(self::all(), array_flip([
            'maintenance_mode', 'maintenance_message', 'customer_registration', 'dealer_registration', 'support_email', 'support_phone',
            'min_booking_hours', 'max_booking_days', 'free_cancellation_hours', 'min_driver_age',
        ]));
    }

    public static function get(string $key): mixed
    {
        return self::all()[$key] ?? null;
    }

    /**
     * Validate and save the given settings, recording each change in the audit log.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public static function update(array $values, User $actor): array
    {
        $definitions = self::definitions();
        $values = array_intersect_key($values, $definitions);
        $data = Validator::make($values, array_map(fn (array $d) => $d['rules'], array_intersect_key($definitions, $values)))->validate();
        $current = self::all();

        DB::transaction(function () use ($data, $current, $definitions, $actor) {
            foreach ($data as $key => $value) {
                $value = self::cast($definitions[$key]['default'], $value);
                if ($value === $current[$key]) {
                    continue;
                }
                DB::table('settings')->updateOrInsert(['key' => $key], ['value' => json_encode($value), 'updated_by' => $actor->id, 'updated_at' => now(), 'created_at' => now()]);
                AuditLog::record("settings.{$key}", "Changed {$definitions[$key]['label']} from ".self::describe($current[$key]).' to '.self::describe($value),
                    severity: ($definitions[$key]['sensitive'] ?? false) ? 'warning' : 'info', actor: $actor);
            }
        });

        self::flush();

        return self::all();
    }

    public static function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
        self::$loaded = null;
    }

    /** Keep the stored type in line with the default (form posts can send "5" for 5). */
    private static function cast(mixed $default, mixed $value): mixed
    {
        return match (true) {
            $value === null => null,
            is_bool($default) => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            is_int($default) => (int) $value,
            is_float($default) => round((float) $value, 4),
            default => (string) $value,
        };
    }

    private static function describe(mixed $value): string
    {
        return match (true) {
            $value === null || $value === '' => 'not set',
            is_bool($value) => $value ? 'on' : 'off',
            default => (string) $value,
        };
    }
}
