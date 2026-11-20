<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\User;
use App\Models\Vehicle;
use App\Notifications\Channels\SmsChannel;
use App\Notifications\PlatformNotification;
use App\Services\BookingReminders;
use App\Services\Sms\AfricasTalkingSmsSender;
use App\Services\Sms\SmsSender;
use App\Support\PhoneNumber;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class MessagingTest extends TestCase
{
    use RefreshDatabase;

    public function test_channels_follow_category_and_preferences(): void
    {
        $user = User::factory()->create(['role' => UserRole::Customer, 'phone' => '0712345678']);
        $channels = fn (string $category, bool $sms = false) => (new PlatformNotification('T', 'B', category: $category, sms: $sms))->via($user->fresh());

        $this->assertSame(['database', 'mail'], $channels('booking'));
        $this->assertSame(['database', 'mail', SmsChannel::class], $channels('booking', true));

        $user->update(['preferences' => ['email_bookings' => false, 'email_receipts' => false, 'sms_reminders' => false]]);
        $this->assertSame(['database'], $channels('booking', true));
        $this->assertSame(['database'], $channels('payment'));
        $this->assertSame(['database', 'mail'], $channels('account')); // always emailed

        $user->update(['phone' => null, 'preferences' => null]);
        $this->assertSame(['database', 'mail'], $channels('booking', true)); // no phone, no text
        $this->assertSame([SmsChannel::class], (new PlatformNotification('T', 'B', sms: true))->via(new AnonymousNotifiable));
    }

    public function test_sms_channel_normalises_numbers_and_uses_the_configured_sender(): void
    {
        $this->assertSame('+254712345678', PhoneNumber::toE164('0712 345 678'));
        $this->assertSame('+254112345678', PhoneNumber::toE164('+254 112-345-678'));
        $this->assertNull(PhoneNumber::toE164('020 123 4567')); // landline
        $this->assertNull(PhoneNumber::toE164(null));

        $sent = [];
        $this->app->instance(SmsSender::class, new class($sent) implements SmsSender
        {
            public function __construct(private array &$sent) {}

            public function send(string $to, string $message): void
            {
                $this->sent[] = [$to, $message];
            }

            public function name(): string
            {
                return 'fake';
            }
        });
        $user = User::factory()->create(['role' => UserRole::Customer, 'phone' => '0712 345 678']);
        $user->notify(new PlatformNotification('Pickup reminder', 'Your car is ready.', category: 'booking', sms: true));

        $this->assertSame([['+254712345678', 'DriveFleet: Pickup reminder. Your car is ready.']], $sent);
        $this->assertSame('Pickup reminder', $user->notifications()->sole()->data['title']);
    }

    public function test_africas_talking_request_and_failure(): void
    {
        Http::fake([
            'api.sandbox.africastalking.com/*' => Http::response(['SMSMessageData' => ['Recipients' => [['statusCode' => 101, 'status' => 'Success']]]]),
            'api.africastalking.com/*' => Http::response(['SMSMessageData' => ['Recipients' => [['statusCode' => 403, 'status' => 'InvalidPhoneNumber']]]]),
        ]);

        (new AfricasTalkingSmsSender('sandbox', 'key123', 'DRIVEFLEET'))->send('+254712345678', 'Hello');
        Http::assertSent(fn ($r) => $r->url() === 'https://api.sandbox.africastalking.com/version1/messaging'
            && $r->header('apiKey')[0] === 'key123' && $r['to'] === '+254712345678' && $r['from'] === 'DRIVEFLEET');

        $this->expectExceptionMessage('InvalidPhoneNumber');
        (new AfricasTalkingSmsSender('drivefleet', 'key123'))->send('+254700000000', 'Hello');
    }

    public function test_forgot_and_reset_password(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'jane@example.com']);

        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk(); // same answer, nothing sent
        $this->postJson('/api/auth/forgot-password', ['email' => 'JANE@example.com'])->assertOk()->assertJsonPath('message', fn ($m) => str_contains($m, 'on its way'));
        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $n) use (&$token, $user) {
            $token = $n->token;

            return str_contains($n->toMail($user)->actionUrl, '/reset-password?token=');
        });
        Notification::assertCount(1);

        $this->postJson('/api/auth/reset-password', ['token' => 'wrong', 'email' => 'jane@example.com', 'password' => 'Newpass123', 'password_confirmation' => 'Newpass123'])
            ->assertJsonValidationErrors('email');
        $this->postJson('/api/auth/reset-password', ['token' => $token, 'email' => 'jane@example.com', 'password' => 'Newpass123', 'password_confirmation' => 'Newpass123'])->assertOk();
        $this->assertTrue(Hash::check('Newpass123', $user->fresh()->password));
        $this->postJson('/api/auth/login', ['email' => 'jane@example.com', 'password' => 'Newpass123'])->assertOk();
    }

    public function test_sign_up_sends_a_verification_link_that_confirms_the_email(): void
    {
        Notification::fake();
        $this->postJson('/api/auth/register', [
            'name' => 'New Customer', 'email' => 'new@example.com', 'role' => 'customer', 'password' => 'Password123', 'password_confirmation' => 'Password123',
        ])->assertCreated()->assertJsonPath('user.email_verified', false);
        $user = User::where('email', 'new@example.com')->sole();
        Notification::assertSentTo($user, VerifyEmail::class);

        $this->postJson('/api/auth/email/verification-notification')->assertOk();
        Notification::assertSentToTimes($user, VerifyEmail::class, 2);

        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->get($url)->assertRedirect('/dashboard?verified=1');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->get('/email/verify/'.$user->id.'/'.sha1($user->email))->assertForbidden(); // unsigned
        $this->actingAs($user->fresh())->postJson('/api/auth/email/verification-notification')->assertStatus(422);
    }

    public function test_reminders_go_out_once_each(): void
    {
        Notification::fake();
        $customer = User::factory()->create(['role' => UserRole::Customer, 'phone' => '0712345678']);
        $vehicle = Vehicle::factory()->create();
        $dealerStaff = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $vehicle->dealer_id]);

        $pickup = Booking::factory()->for($vehicle)->create(['customer_id' => $customer->id, 'status' => BookingStatus::Confirmed, 'pickup_at' => now()->addHours(20), 'return_at' => now()->addDays(3)]);
        Booking::factory()->for($vehicle)->create(['customer_id' => $customer->id, 'status' => BookingStatus::Confirmed, 'pickup_at' => now()->addDays(5), 'return_at' => now()->addDays(6)]);
        $returning = Booking::factory()->for($vehicle)->create(['customer_id' => $customer->id, 'status' => BookingStatus::Active, 'pickup_at' => now()->subDay(), 'return_at' => now()->addHours(2)]);
        $overdue = Booking::factory()->for($vehicle)->create(['customer_id' => null, 'customer_phone' => '0722000111', 'status' => BookingStatus::Active, 'pickup_at' => now()->subDays(3), 'return_at' => now()->subHour()]);

        $this->assertSame(['pickup' => 1, 'return' => 1, 'overdue' => 1, 'escalated' => 0], app(BookingReminders::class)->send());
        $this->assertSame(['pickup' => 0, 'return' => 0, 'overdue' => 0, 'escalated' => 0], app(BookingReminders::class)->send());

        Notification::assertSentTo($customer, PlatformNotification::class, fn ($n) => $n->title === 'Pickup reminder' && $n->sms);
        Notification::assertSentTo($customer, PlatformNotification::class, fn ($n) => $n->title === 'Return reminder');
        Notification::assertSentOnDemand(PlatformNotification::class, fn ($n, $channels, $notifiable) => $n->title === 'Your rental is overdue' && $notifiable->routes['sms'] === '0722000111');
        Notification::assertSentTo($dealerStaff, PlatformNotification::class, fn ($n) => $n->title === 'Overdue return');
        $this->assertNotNull($pickup->fresh()->pickup_reminded_at);
        $this->assertNotNull($returning->fresh()->return_reminded_at);
        $this->assertNotNull($overdue->fresh()->overdue_notified_at);
    }
}
