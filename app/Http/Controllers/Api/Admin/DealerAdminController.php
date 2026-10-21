<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\BookingStatus;
use App\Enums\DealerStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dealer;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class DealerAdminController extends Controller
{
    use CreatesAccounts;

    public function index(Request $request): JsonResponse
    {
        $dealers = Dealer::query()
            ->withCount(['vehicles', 'staff', 'bookings as active_rentals' => fn ($q) => $q->where('status', BookingStatus::Active)])
            ->when($request->filled('status') && $request->input('status') !== 'All', fn ($q) => $q->where('status', strtolower((string) $request->input('status'))))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('city', 'like', $term)->orWhere('owner_name', 'like', $term));
            })
            ->orderBy('name')
            ->get();

        $revenue = Payment::where('status', PaymentStatus::Completed)->where('paid_at', '>=', now()->startOfMonth())
            ->selectRaw('dealer_id, sum(amount) as total')->groupBy('dealer_id')->pluck('total', 'dealer_id');

        return response()->json([
            'data' => $dealers->map(fn (Dealer $d) => [...$this->present($d), 'revenue_this_month' => (int) ($revenue[$d->id] ?? 0)]),
            'summary' => [
                'total' => Dealer::count(),
                'active' => Dealer::where('status', DealerStatus::Active)->count(),
                'suspended' => Dealer::where('status', DealerStatus::Suspended)->count(),
                'vehicles' => Vehicle::count(),
            ],
        ]);
    }

    public function show(Dealer $dealer): JsonResponse
    {
        $dealer->loadCount(['vehicles', 'staff', 'bookings as active_rentals' => fn ($q) => $q->where('status', BookingStatus::Active)]);

        $fleet = $dealer->vehicles()->selectRaw('type, count(*) as total, sum(case when status = ? then 1 else 0 end) as rented', [VehicleStatus::Rented->value])
            ->groupBy('type')->orderByDesc('total')->get()
            ->map(fn ($r) => ['type' => $r->type, 'count' => (int) $r->total, 'rented' => (int) $r->rented]);

        return response()->json(['data' => [
            ...$this->present($dealer),
            'fleet_breakdown' => $fleet,
            'staff' => $dealer->staff()->orderBy('name')->get()->map(fn (User $u) => $this->presentStaff($u)),
            'revenue_this_month' => (int) Payment::where('dealer_id', $dealer->id)->where('status', PaymentStatus::Completed)->where('paid_at', '>=', now()->startOfMonth())->sum('amount'),
            'completed_bookings' => $dealer->bookings()->where('status', BookingStatus::Completed)->count(),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $dealer = Dealer::create($this->validated($request));
        AuditLog::record('dealer.created', "Onboarded dealer {$dealer->name}", $dealer);

        return response()->json(['data' => $this->present($dealer)], 201);
    }

    public function update(Request $request, Dealer $dealer): JsonResponse
    {
        $before = $dealer->status;
        $dealer->update($this->validated($request, $dealer));

        if ($before !== $dealer->status) {
            AuditLog::record("dealer.{$dealer->status->value}", "Dealer {$dealer->name} marked {$dealer->status->value}", $dealer,
                $dealer->status === DealerStatus::Suspended ? 'warning' : 'info');
        } else {
            AuditLog::record('dealer.updated', "Updated dealer {$dealer->name}", $dealer);
        }

        return $this->show($dealer);
    }

    /**
     * Dealers with booking history are suspended rather than deleted, so
     * customers' invoices and payments stay intact.
     */
    public function destroy(Dealer $dealer): Response
    {
        abort_if($dealer->bookings()->exists(), 422, "{$dealer->name} has bookings on record. Suspend the dealer instead of deleting it.");
        AuditLog::record('dealer.deleted', "Deleted dealer {$dealer->name}", null, 'warning');
        $dealer->delete();

        return response()->noContent();
    }

    public function addStaff(Request $request, Dealer $dealer): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'job_title' => ['required', 'string', 'max:80'],
        ]);
        $limit = $dealer->plan?->staff_limit;
        if ($limit !== null && $dealer->staff()->count() >= $limit) {
            abort(422, "The {$dealer->plan->name} plan allows {$limit} staff logins. Upgrade the plan to add more.");
        }
        [$user, $password] = $this->createAccount(UserRole::Dealer, [...$data, 'dealer_id' => $dealer->id, 'company' => $dealer->name]);
        AuditLog::record('dealer.staff_added', "Added {$user->email} to {$dealer->name}", $dealer);

        return response()->json(['data' => $this->presentStaff($user), 'temporary_password' => $password], 201);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Dealer $existing = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('dealers')->ignore($existing)],
            'city' => ['required', 'string', 'max:80'],
            'county' => ['nullable', 'string', 'max:80'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::enum(DealerStatus::class)],
            'tier' => ['required', Rule::in(['silver', 'gold', 'platinum'])],
            'license_no' => ['nullable', 'string', 'max:60'],
            'tax_pin' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'owner_name' => ['nullable', 'string', 'max:120'],
            'owner_phone' => ['nullable', 'string', 'max:30'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_national_id' => ['nullable', 'string', 'max:30'],
            'manager_name' => ['nullable', 'string', 'max:120'],
            'manager_phone' => ['nullable', 'string', 'max:30'],
            'manager_email' => ['nullable', 'email', 'max:255'],
        ], ['name.unique' => 'A dealer with that name already exists.']);
    }

    /** @return array<string, mixed> */
    private function present(Dealer $d): array
    {
        return [
            ...$d->only(['id', 'name', 'city', 'county', 'address', 'phone', 'email', 'website', 'tier', 'license_no', 'tax_pin', 'notes',
                'owner_name', 'owner_phone', 'owner_email', 'owner_national_id', 'manager_name', 'manager_phone', 'manager_email']),
            'reference' => 'DLR-'.str_pad((string) $d->id, 3, '0', STR_PAD_LEFT),
            'status' => $d->status->value,
            'joined' => $d->created_at->toIso8601String(),
            'vehicle_count' => (int) ($d->vehicles_count ?? 0),
            'staff_count' => (int) ($d->staff_count ?? 0),
            'active_rentals' => (int) ($d->active_rentals ?? 0),
        ];
    }

    /** @return array<string, mixed> */
    public static function presentStaff(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'job_title' => $u->job_title,
            'role' => $u->role->value,
            'status' => $u->isDisabled() ? 'suspended' : 'active',
            'joined' => $u->created_at->toIso8601String(),
            'last_login_at' => $u->last_login_at?->toIso8601String(),
        ];
    }
}
