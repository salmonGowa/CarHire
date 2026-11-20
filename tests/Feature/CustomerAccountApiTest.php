<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CustomerAccountApiTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->customer = User::factory()->create(['role' => UserRole::Customer, 'kyc_status' => 'pending']);
    }

    public function test_profile_update_and_email_change_needs_password(): void
    {
        $this->actingAs($this->customer)->putJson('/api/profile', ['name' => 'Jane', 'email' => 'new@x.test'])
            ->assertJsonValidationErrors('current_password');
        $this->actingAs($this->customer)->putJson('/api/profile', [
            'name' => 'Jane Doe', 'email' => 'new@x.test', 'current_password' => 'password', 'national_id' => '12345678',
            'licence_number' => 'DL123', 'licence_expires_on' => now()->subDay()->toDateString(),
        ])->assertOk()->assertJsonPath('data.email', 'new@x.test')->assertJsonPath('data.licence_expired', true);

        // Verified identity details are locked.
        $this->customer->update(['kyc_status' => 'verified']);
        $this->actingAs($this->customer)->putJson('/api/profile', ['name' => 'Jane Doe', 'email' => 'new@x.test', 'national_id' => '999'])
            ->assertUnprocessable();
        $this->actingAs($this->customer)->putJson('/api/profile', ['name' => 'Jane D', 'email' => 'new@x.test', 'national_id' => '12345678'])->assertOk();
    }

    public function test_preferences_are_validated_and_merged(): void
    {
        $this->actingAs($this->customer)->putJson('/api/profile/preferences', ['mpesa_phone' => '123'])->assertJsonValidationErrors('mpesa_phone');
        $this->actingAs($this->customer)->putJson('/api/profile/preferences', ['preferred_vehicle_types' => ['SUV'], 'mpesa_phone' => '0712345678'])->assertOk();
        $this->actingAs($this->customer)->putJson('/api/profile/preferences', ['marketing' => true])
            ->assertJsonPath('data.preferences.mpesa_phone', '0712345678')
            ->assertJsonPath('data.preferences.preferred_vehicle_types', ['SUV'])
            ->assertJsonPath('data.preferences.marketing', true)
            ->assertJsonPath('data.preferences.email_bookings', true);
    }

    public function test_password_change(): void
    {
        $this->actingAs($this->customer)->putJson('/api/profile/password', ['current_password' => 'wrong', 'password' => 'newpass123', 'password_confirmation' => 'newpass123'])
            ->assertJsonValidationErrors('current_password');
        $this->actingAs($this->customer)->putJson('/api/profile/password', ['current_password' => 'password', 'password' => 'newpass123', 'password_confirmation' => 'newpass123'])
            ->assertOk();
        $this->assertTrue(Hash::check('newpass123', $this->customer->fresh()->password));
    }

    public function test_kyc_documents_upload_and_admin_review(): void
    {
        $this->customer->update(['kyc_status' => 'rejected', 'kyc_note' => 'blurry']);
        $upload = fn (string $type) => $this->actingAs($this->customer)->post('/api/profile/documents',
            ['type' => $type, 'file' => UploadedFile::fake()->image('id.jpg')], ['Accept' => 'application/json']);

        $upload('selfie')->assertJsonValidationErrors('type');
        $upload('id_front')->assertCreated()->assertJsonPath('data.kyc.status', 'pending')->assertJsonCount(1, 'data.documents');
        $upload('id_front')->assertJsonCount(1, 'data.documents'); // replaced, not duplicated
        $doc = $this->customer->documents()->sole();

        $other = User::factory()->create(['role' => UserRole::Customer]);
        $this->actingAs($other)->get("/api/documents/{$doc->id}/file")->assertNotFound();
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->actingAs($admin)->get("/api/documents/{$doc->id}/file")->assertOk();
        $this->actingAs($admin)->getJson("/api/admin/clients/{$this->customer->id}")->assertJsonPath('data.documents.0.label', 'National ID (front)');

        $this->actingAs($admin)->postJson("/api/admin/clients/{$this->customer->id}/kyc", ['decision' => 'verified'])->assertOk();
        $this->assertSame('Identity verified', $this->customer->notifications()->sole()->data['title']);
        $this->actingAs($this->customer->fresh())->deleteJson("/api/profile/documents/{$doc->id}")->assertUnprocessable();
    }

    public function test_account_deletion_rules(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Dealer]))->deleteJson('/api/profile', ['password' => 'password'])->assertForbidden();

        $booking = Booking::factory()->create(['customer_id' => $this->customer->id, 'status' => BookingStatus::Confirmed]);
        $this->actingAs($this->customer)->deleteJson('/api/profile', ['password' => 'password'])->assertUnprocessable();
        $booking->update(['status' => BookingStatus::Completed]);
        Invoice::create(['number' => 'INV-T-1', 'booking_id' => $booking->id, 'dealer_id' => $booking->dealer_id, 'customer_id' => $this->customer->id,
            'customer_name' => 'X', 'issued_at' => now(), 'subtotal' => 1000, 'vat' => 160, 'total' => 1160, 'amount_paid' => 0]);
        $this->actingAs($this->customer)->deleteJson('/api/profile', ['password' => 'password'])->assertUnprocessable();
        Invoice::query()->update(['amount_paid' => 1160]);

        $this->actingAs($this->customer)->deleteJson('/api/profile', ['password' => 'wrong'])->assertJsonValidationErrors('password');
        $this->actingAs($this->customer)->deleteJson('/api/profile', ['password' => 'password'])->assertNoContent();
        $this->assertModelMissing($this->customer);
        $this->assertNull($booking->fresh()->customer_id); // dealer keeps the booking record
    }

    public function test_notifications_follow_booking_lifecycle(): void
    {
        $vehicle = Vehicle::factory()->create();
        $dealer = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $vehicle->dealer_id]);
        $id = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'vehicle_id' => $vehicle->id, 'pickup_location' => 'CBD',
            'pickup_at' => now()->addDays(3)->setTime(10, 0)->toDateTimeString(), 'return_at' => now()->addDays(5)->setTime(10, 0)->toDateTimeString(),
        ])->assertCreated()->json('data.id');
        $this->assertSame('New booking request', $dealer->notifications()->sole()->data['title']);

        $this->actingAs($dealer)->patchJson("/api/bookings/{$id}/status", ['status' => 'confirmed'])->assertOk();
        $this->actingAs($this->customer)->getJson('/api/notifications')->assertJsonPath('unread', 1)->assertJsonPath('data.0.title', 'Booking confirmed');
        $nid = $this->customer->notifications()->first()->id;
        $this->actingAs($this->customer)->postJson("/api/notifications/{$nid}/read")->assertJsonPath('unread', 0);
        $this->actingAs($dealer)->postJson("/api/notifications/{$nid}/read")->assertNotFound();

        $this->actingAs($this->customer)->getJson('/api/trips/current')->assertJsonPath('data.booking.id', $id)->assertJsonPath('upcoming', 1);
    }

    public function test_rewards_points_and_tier(): void
    {
        $booking = Booking::factory()->create(['customer_id' => $this->customer->id, 'status' => BookingStatus::Completed, 'rating' => 5, 'rated_at' => now()]);
        Invoice::create(['number' => 'INV-T-2', 'booking_id' => $booking->id, 'dealer_id' => $booking->dealer_id, 'customer_id' => $this->customer->id,
            'customer_name' => 'X', 'issued_at' => now(), 'subtotal' => 51724, 'vat' => 8276, 'total' => 60000, 'amount_paid' => 60000]);
        Payment::create([...Payment::split(60000), 'reference' => 'PAY-T-1', 'invoice_id' => Invoice::first()->id, 'booking_id' => $booking->id, 'dealer_id' => $booking->dealer_id,
            'customer_id' => $this->customer->id, 'amount' => 60000, 'method' => 'mpesa', 'status' => PaymentStatus::Completed, 'paid_at' => now()]);

        $this->actingAs($this->customer)->getJson('/api/rewards')->assertOk()
            ->assertJsonPath('points', 650)->assertJsonPath('tier', 'Silver')->assertJsonPath('next_tier.name', 'Gold')->assertJsonPath('next_tier.threshold', 150000);
        $this->actingAs(User::factory()->create(['role' => UserRole::Dealer]))->getJson('/api/rewards')->assertForbidden();
    }

    public function test_support_attachments_are_private_to_the_ticket(): void
    {
        $id = $this->actingAs($this->customer)->post('/api/support-tickets', [
            'subject' => 'Scratch on bumper', 'category' => 'Complaint', 'body' => 'See photo',
            'attachments' => [UploadedFile::fake()->image('bumper.jpg')],
        ], ['Accept' => 'application/json'])->assertCreated()->json('data.id');

        $attachment = $this->actingAs($this->customer)->getJson("/api/support-tickets/{$id}")->json('data.messages.0.attachments.0');
        $this->assertTrue($attachment['is_image']);
        $this->actingAs($this->customer)->get("/api/support-attachments/{$attachment['id']}")->assertOk();
        $this->actingAs(User::factory()->create(['role' => UserRole::Customer]))->get("/api/support-attachments/{$attachment['id']}")->assertNotFound();

        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->actingAs($admin)->postJson("/api/support-tickets/{$id}/messages", ['body' => 'Looking into it']);
        $this->assertSame('Reply on '.SupportTicket::find($id)->reference, $this->customer->notifications()->sole()->data['title']);
    }
}
