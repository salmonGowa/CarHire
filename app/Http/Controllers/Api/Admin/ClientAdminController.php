<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * Platform customers ("clients"), their KYC and account standing.
 */
class ClientAdminController extends Controller
{
    use CreatesAccounts;

    /** Loyalty tier by lifetime paid value (KSh). */
    public const TIERS = [500000 => 'Platinum', 150000 => 'Gold', 50000 => 'Silver', 0 => 'Bronze'];

    public function index(Request $request): JsonResponse
    {
        $clients = $this->query()
            ->when($request->filled('kyc') && $request->input('kyc') !== 'All', fn ($q) => $q->where('kyc_status', strtolower((string) $request->input('kyc'))))
            ->when($request->input('status') === 'Active', fn ($q) => $q->whereNull('disabled_at')->whereNull('flagged_at'))
            ->when($request->input('status') === 'Suspended', fn ($q) => $q->whereNotNull('disabled_at'))
            ->when($request->input('status') === 'Flagged', fn ($q) => $q->whereNotNull('flagged_at'))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('email', 'like', $term)->orWhere('phone', 'like', $term)->orWhere('national_id', 'like', $term));
            })
            ->get()
            ->map(fn (User $u) => $this->present($u));

        $clients = match ($request->input('sort')) {
            'ltv' => $clients->sortByDesc('ltv'),
            'name' => $clients->sortBy('name'),
            default => $clients->sortByDesc('joined'),
        };

        $all = User::where('role', UserRole::Customer);

        return response()->json([
            'data' => $clients->values(),
            'summary' => [
                'total' => (clone $all)->count(),
                'active' => (clone $all)->whereNull('disabled_at')->count(),
                'verified' => (clone $all)->where('kyc_status', 'verified')->count(),
                'pending' => (clone $all)->where('kyc_status', 'pending')->count(),
                'flagged' => (clone $all)->whereNotNull('flagged_at')->count(),
                'lifetime_value' => (int) Payment::where('status', PaymentStatus::Completed)->whereIn('customer_id', (clone $all)->select('id'))->sum('amount'),
            ],
        ]);
    }

    public function show(User $client): JsonResponse
    {
        $this->assertCustomer($client);
        $client = $this->query()->findOrFail($client->id);

        $bookings = Booking::with(['vehicle', 'dealer'])->where('customer_id', $client->id)->orderByDesc('pickup_at')->limit(50)->get();
        $payments = Payment::with('booking')->where('customer_id', $client->id)->orderByDesc('paid_at')->limit(50)->get();
        $activity = AuditLog::where(fn ($q) => $q->where('subject_type', $client->getMorphClass())->where('subject_id', $client->id))
            ->orWhere('user_id', $client->id)->latest('created_at')->limit(30)->get();

        return response()->json(['data' => [
            ...$this->present($client),
            'bookings' => $bookings->map(fn (Booking $b) => [
                'id' => $b->id, 'reference' => $b->reference, 'status' => $b->status->value,
                'vehicle' => $b->vehicle ? "{$b->vehicle->model} ({$b->vehicle->plate})" : null,
                'dealer' => $b->dealer?->name, 'pickup_at' => $b->pickup_at->toIso8601String(), 'total' => $b->total,
            ]),
            'payments' => $payments->map(fn (Payment $p) => [
                'id' => $p->id, 'reference' => $p->reference, 'amount' => $p->amount, 'method' => $p->method->value,
                'status' => $p->status->value, 'paid_at' => $p->paid_at->toIso8601String(), 'booking_reference' => $p->booking?->reference,
            ]),
            'activity' => $activity->map(fn (AuditLog $l) => ['action' => $l->description, 'by' => $l->actor, 'at' => $l->created_at->toIso8601String()]),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        [$user, $password] = $this->createAccount(UserRole::Customer, $data);
        AuditLog::record('client.created', "Created client account {$user->email}", $user);

        return response()->json(['data' => $this->present($this->query()->findOrFail($user->id)), 'temporary_password' => $password], 201);
    }

    public function update(Request $request, User $client): JsonResponse
    {
        $this->assertCustomer($client);
        $client->update($this->validated($request, $client));
        AuditLog::record('client.updated', "Updated profile of {$client->email}", $client);

        return $this->show($client);
    }

    public function kyc(Request $request, User $client): JsonResponse
    {
        $this->assertCustomer($client);
        $data = $request->validate([
            'decision' => ['required', Rule::in(['verified', 'rejected'])],
            'note' => [Rule::requiredIf($request->input('decision') === 'rejected'), 'nullable', 'string', 'max:255'],
        ], ['note.required' => 'Give a reason for rejecting.']);

        $client->update(['kyc_status' => $data['decision'], 'kyc_note' => $data['note'] ?? null, 'kyc_reviewed_at' => now(), 'kyc_reviewed_by' => $request->user()->id]);
        AuditLog::record("client.kyc_{$data['decision']}", 'KYC '.$data['decision'].($data['note'] ?? null ? " ({$data['note']})" : '')." for {$client->email}", $client,
            $data['decision'] === 'rejected' ? 'warning' : 'info');

        return $this->show($client);
    }

    public function flag(Request $request, User $client): JsonResponse
    {
        $this->assertCustomer($client);
        $flag = $request->boolean('flagged');
        $client->update(['flagged_at' => $flag ? now() : null]);
        AuditLog::record($flag ? 'client.flagged' : 'client.unflagged', ($flag ? 'Flagged ' : 'Cleared flag on ').$client->email, $client, $flag ? 'warning' : 'info');

        return $this->show($client);
    }

    /**
     * Deleting a client keeps their bookings and payments (the customer link
     * is cleared; names stay on the records) for the dealers' books.
     */
    public function destroy(User $client): Response
    {
        $this->assertCustomer($client);
        abort_if(Booking::where('customer_id', $client->id)->whereIn('status', BookingStatus::blocking())->exists(), 422,
            'This client has open bookings. Cancel or complete them first.');
        AuditLog::record('client.deleted', "Deleted client account {$client->email}", null, 'warning');
        $client->delete();

        return response()->noContent();
    }

    private function query()
    {
        return User::query()->where('role', UserRole::Customer)
            ->withSum(['payments as ltv' => fn ($q) => $q->where('status', PaymentStatus::Completed)], 'amount')
            ->withCount([
                'bookings as booking_count',
                'bookings as completed_count' => fn ($q) => $q->where('status', BookingStatus::Completed),
                'bookings as cancelled_count' => fn ($q) => $q->where('status', BookingStatus::Cancelled),
            ])
            ->with('kycReviewer');
    }

    private function assertCustomer(User $user): void
    {
        abort_unless($user->role === UserRole::Customer, 404);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?User $existing = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($existing)],
            'phone' => ['nullable', 'string', 'max:30'],
            'alt_phone' => ['nullable', 'string', 'max:30'],
            'national_id' => ['nullable', 'string', 'max:30'],
            'kra_pin' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'address' => ['nullable', 'string', 'max:255'],
            'county' => ['nullable', 'string', 'max:60'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    /** @return array<string, mixed> */
    private function present(User $u): array
    {
        $ltv = (int) ($u->ltv ?? 0);
        $closed = (int) $u->completed_count + (int) $u->cancelled_count;

        return [
            ...$u->only(['id', 'name', 'email', 'phone', 'alt_phone', 'national_id', 'kra_pin', 'gender', 'address', 'county', 'admin_notes']),
            'reference' => 'USR-'.str_pad((string) $u->id, 5, '0', STR_PAD_LEFT),
            'date_of_birth' => $u->date_of_birth?->toDateString(),
            'joined' => $u->created_at->toIso8601String(),
            'last_login_at' => $u->last_login_at?->toIso8601String(),
            'status' => $u->isDisabled() ? 'Suspended' : ($u->flagged_at ? 'Flagged' : 'Active'),
            'flagged' => $u->flagged_at !== null,
            'kyc' => ucfirst($u->kyc_status),
            'kyc_reviewed_at' => $u->kyc_reviewed_at?->toIso8601String(),
            'kyc_reviewer' => $u->kycReviewer?->name,
            'kyc_note' => $u->kyc_note,
            'ltv' => $ltv,
            'tier' => collect(self::TIERS)->first(fn ($name, $min) => $ltv >= $min),
            'bookings_count' => (int) $u->booking_count,
            'completed_trips' => (int) $u->completed_count,
            // Share of finished bookings that were completed rather than cancelled.
            'completion_rate' => $closed ? (int) round($u->completed_count / $closed * 100) : null,
        ];
    }
}
