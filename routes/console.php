<?php

use App\Services\BookingReminders;
use App\Services\PlatformAlerts;
use App\Services\SubscriptionBilling;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('drivefleet:bill-subscriptions {--month= : YYYY-MM, defaults to this month}', function (SubscriptionBilling $billing) {
    $month = $this->option('month') ? Carbon::createFromFormat('Y-m-d', $this->option('month').'-01') : now();
    $this->info("Issued {$billing->issue($month)} subscription charges for {$month->format('F Y')}.");
})->purpose("Raise the month's dealer subscription charges");

Schedule::command('drivefleet:bill-subscriptions')->monthlyOn(1, '06:00');

// Lets the admin Integrations page show whether the scheduler is alive.
Schedule::call(fn () => Cache::put(PlatformAlerts::SCHEDULER_HEARTBEAT, now(), now()->addDay()))->everyMinute()->name('scheduler-heartbeat');

Artisan::command('drivefleet:send-reminders', function (BookingReminders $reminders) {
    $sent = $reminders->send();
    $this->info("Sent {$sent['pickup']} pickup, {$sent['return']} return and {$sent['overdue']} overdue reminders; escalated {$sent['escalated']} long-overdue rentals.");
})->purpose('Text and email pickup, return and overdue reminders');

Schedule::command('drivefleet:send-reminders')->everyFifteenMinutes()->withoutOverlapping();
