<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRequest;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\User;
use App\Models\UserDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The signed-in user's own account: details, preferences, password, identity
 * documents and closing the account.
 */
class ProfileController extends Controller
{
    /** Saved preferences and their defaults. */
    public const PREFERENCES = [
        'preferred_vehicle_types' => [],
        'default_pickup_location' => null,
        'mpesa_phone' => null,
        'email_bookings' => true,
        'email_receipts' => true,
        'sms_reminders' => true,
        'marketing' => false,
    ];

    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->present($request->user())]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $verified = $user->kyc_status === 'verified';
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => [Rule::requiredIf($request->input('email') !== $user->email), 'nullable', 'current_password'],
            'phone' => ['nullable', 'string', 'max:30'],
            'alt_phone' => ['nullable', 'string', 'max:30'],
            'date_of_birth' => ['nullable', 'date', 'before:-16 years'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'address' => ['nullable', 'string', 'max:255'],
            'county' => ['nullable', 'string', 'max:60'],
            'national_id' => ['nullable', 'string', 'max:20'],
            'kra_pin' => ['nullable', 'string', 'max:20'],
            'licence_number' => ['nullable', 'string', 'max:30'],
            'licence_expires_on' => ['nullable', 'date'],
        ], [
            'current_password.required' => 'Enter your current password to change your email.',
            'current_password.current_password' => 'That password is not correct.',
            'date_of_birth.before' => 'Check your date of birth.',
        ]);
        unset($data['current_password']);

        // Once identity is verified, the details it was checked against can't change without a new review.
        foreach (['national_id', 'date_of_birth'] as $locked) {
            $incoming = $data[$locked] ?? null;
            $current = $locked === 'date_of_birth' ? $user->date_of_birth?->toDateString() : $user->national_id;
            if ($verified && $incoming !== $current && ($incoming !== null || $current !== null)) {
                abort(422, 'Your ID number and date of birth are verified. Contact support to change them.');
            }
        }

        $user->update($data);
        if ($user->wasChanged('email')) {
            AuditLog::record('profile.email_changed', "Changed email from {$user->getOriginal('email')} to {$user->email}", $user, 'warning');
        }

        return response()->json(['data' => $this->present($user->fresh())]);
    }

    public function preferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'preferred_vehicle_types' => ['sometimes', 'array'],
            'preferred_vehicle_types.*' => [Rule::in(VehicleRequest::TYPES)],
            'default_pickup_location' => ['sometimes', 'nullable', 'string', 'max:120'],
            'mpesa_phone' => ['sometimes', 'nullable', 'string', 'regex:/^(\+?254|0)[17]\d{8}$/'],
            'email_bookings' => ['sometimes', 'boolean'],
            'email_receipts' => ['sometimes', 'boolean'],
            'sms_reminders' => ['sometimes', 'boolean'],
            'marketing' => ['sometimes', 'boolean'],
        ], ['mpesa_phone.regex' => 'Use a Kenyan mobile number, e.g. 0712 345 678.']);

        $user = $request->user();
        $user->update(['preferences' => [...$this->preferencesOf($user), ...$data]]);

        return response()->json(['data' => $this->present($user)]);
    }

    public function password(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(8), 'different:current_password'],
        ], ['current_password.current_password' => 'That password is not correct.', 'password.different' => 'Choose a password you haven\'t used here.']);

        $request->user()->update(['password' => $data['password']]);
        // Other browsers signed in as this user are signed out on their next request.
        Auth::logoutOtherDevices($data['password']);
        AuditLog::record('profile.password_changed', "Changed password for {$request->user()->email}", $request->user());

        return response()->json(['message' => 'Password changed. Other devices have been signed out.']);
    }

    public function signOutOthers(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'current_password']], ['password.current_password' => 'That password is not correct.']);
        Auth::logoutOtherDevices($data['password']);
        AuditLog::record('profile.sessions_revoked', "Signed out other devices for {$request->user()->email}", $request->user());

        return response()->json(['message' => 'Every other device has been signed out.']);
    }

    /** Customers can close their own account; staff accounts are managed by admins. */
    public function destroy(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->role === UserRole::Customer, 403, 'Staff accounts are closed by a DriveFleet admin.');
        $request->validate(['password' => ['required', 'current_password']], ['password.current_password' => 'That password is not correct.']);

        abort_if(Booking::where('customer_id', $user->id)->whereIn('status', BookingStatus::blocking())->exists(), 422,
            'You have bookings in progress. Cancel or finish them first.');
        $owed = Invoice::where('customer_id', $user->id)->whereNull('voided_at')->get()->sum(fn (Invoice $i) => $i->balance());
        abort_if($owed > 0, 422, 'You have KSh '.number_format($owed).' unpaid. Settle it with the dealer first.');

        AuditLog::record('profile.deleted', "{$user->email} closed their account", null, 'warning', $user);
        foreach ($user->documents as $doc) {
            Storage::disk('local')->delete($doc->path);
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $user->delete();

        return response()->noContent();
    }

    /** Upload an ID or licence scan; it goes to KYC review. Re-uploading a type replaces the old file. */
    public function uploadDocument(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === UserRole::Customer, 403);
        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(UserDocument::TYPES))],
            'file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
        ], ['file.max' => 'Files can be up to 5 MB.', 'file.mimes' => 'Upload a photo (JPG, PNG) or a PDF.']);

        foreach ($user->documents()->where('type', $data['type'])->get() as $old) {
            Storage::disk('local')->delete($old->path);
            $old->delete();
        }
        $file = $request->file('file');
        $user->documents()->create([
            'type' => $data['type'],
            'path' => $file->store("customer-documents/{$user->id}", 'local'),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
        ]);

        // A new upload after a rejection goes back into the review queue.
        if ($user->kyc_status === 'rejected') {
            $user->update(['kyc_status' => 'pending', 'kyc_note' => null, 'kyc_reviewed_at' => null, 'kyc_reviewed_by' => null]);
        }
        AuditLog::record('kyc.uploaded', "{$user->email} uploaded ".UserDocument::TYPES[$data['type']], $user);

        return response()->json(['data' => $this->present($user->fresh())], 201);
    }

    public function deleteDocument(Request $request, UserDocument $document): JsonResponse
    {
        $user = $request->user();
        abort_unless($document->user_id === $user->id, 404);
        abort_if($user->kyc_status === 'verified', 422, 'Your identity is verified, so these documents are kept on file.');
        Storage::disk('local')->delete($document->path);
        $document->delete();

        return response()->json(['data' => $this->present($user->fresh())]);
    }

    /** Owners see their own files; super admins see any customer's (for KYC review). */
    public function downloadDocument(Request $request, UserDocument $document): StreamedResponse
    {
        $user = $request->user();
        abort_unless($document->user_id === $user->id || $user->isSuperAdmin(), 404);
        abort_unless(Storage::disk('local')->exists($document->path), 404, 'The file is missing from storage.');

        return Storage::disk('local')->response($document->path, $document->original_name, ['Content-Type' => $document->mime_type],
            $request->boolean('inline') ? 'inline' : 'attachment');
    }

    /** @return array<string, mixed> */
    private function preferencesOf(User $user): array
    {
        return [...self::PREFERENCES, ...array_intersect_key($user->preferences ?? [], self::PREFERENCES)];
    }

    /** @return array<string, mixed> */
    private function present(User $u): array
    {
        return [
            ...$u->only(['id', 'name', 'email', 'phone', 'alt_phone', 'gender', 'address', 'county', 'national_id', 'kra_pin', 'licence_number']),
            'role' => $u->role->value,
            'date_of_birth' => $u->date_of_birth?->toDateString(),
            'licence_expires_on' => $u->licence_expires_on?->toDateString(),
            'licence_expired' => $u->licence_expires_on?->isPast() ?? false,
            'joined' => $u->created_at->toIso8601String(),
            'kyc' => ['status' => $u->kyc_status, 'note' => $u->kyc_note, 'reviewed_at' => $u->kyc_reviewed_at?->toIso8601String()],
            'documents' => $u->documents()->latest()->get()->map(fn (UserDocument $d) => [
                'id' => $d->id, 'type' => $d->type, 'label' => UserDocument::TYPES[$d->type] ?? $d->type,
                'original_name' => $d->original_name, 'size' => $d->size, 'uploaded_at' => $d->created_at->toIso8601String(),
            ]),
            'document_types' => UserDocument::TYPES,
            'preferences' => $this->preferencesOf($u),
            'vehicle_types' => VehicleRequest::TYPES,
        ];
    }
}
