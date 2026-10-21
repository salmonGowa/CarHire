<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\BookingStatus;
use App\Enums\DealerStatus;
use App\Enums\PaymentStatus;
use App\Enums\PayoutStatus;
use App\Enums\UserRole;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\PlatformAlerts;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

/**
 * Platform analytics for a period. Figures come straight from bookings,
 * payments, payouts, users and vehicles; growth compares with the previous
 * period of the same length.
 */
class ReportsController extends Controller
{
    private const PERIODS = ['7d', '30d', '6m', 'ytd', 'all'];

    public function __invoke(Request $request, PlatformAlerts $alerts): JsonResponse
    {
        $request->validate(['period' => ['nullable', Rule::in(self::PERIODS)]]);
        $period = $request->input('period', '6m');
        $end = now();
        [$start, $buckets] = $this->window($period, $end);
        $prevStart = $period === 'all' ? null : $start->copy()->subSeconds((int) $start->diffInSeconds($end));

        // Everything the report needs, loaded once and sliced in PHP (works on any database).
        $payments = Payment::query()->where('paid_at', '>=', $prevStart ?? $start)
            ->get(['id', 'booking_id', 'dealer_id', 'amount', 'commission', 'method', 'status', 'paid_at', 'refunded_at']);
        $bookings = Booking::query()->with('vehicle:id,type')
            ->where(fn ($q) => $q->where('created_at', '>=', $prevStart ?? $start)->orWhere('return_at', '>=', $start))
            ->get(['id', 'dealer_id', 'vehicle_id', 'customer_id', 'status', 'pickup_at', 'return_at', 'days', 'rating', 'created_at']);
        $payouts = Payout::where('status', PayoutStatus::Paid)->where('paid_at', '>=', $start)->get(['net', 'paid_at']);
        $customers = User::where('role', UserRole::Customer)->get(['id', 'created_at', 'kyc_status', 'national_id']);
        $vehicles = Vehicle::with('dealer:id,status')->get(['id', 'dealer_id', 'type', 'status', 'created_at']);
        $dealers = Dealer::all(['id', 'name', 'city', 'county', 'status']);
        $bookingVehicle = Booking::whereIn('id', $payments->pluck('booking_id')->unique())->pluck('vehicle_id', 'id');
        $firstBookings = Booking::where('status', '!=', BookingStatus::Cancelled)->whereNotNull('customer_id')
            ->selectRaw('customer_id, min(created_at) as first_at, count(*) as total')->groupBy('customer_id')->get()->keyBy('customer_id');

        $in = fn (?CarbonInterface $at, CarbonInterface $from, CarbonInterface $to) => $at !== null && $at->gte($from) && $at->lt($to);
        $completed = fn (CarbonInterface $from, CarbonInterface $to) => $payments->filter(fn ($p) => $p->status === PaymentStatus::Completed && $in($p->paid_at, $from, $to));
        $created = fn (CarbonInterface $from, CarbonInterface $to) => $bookings->filter(fn ($b) => $in($b->created_at, $from, $to));
        $live = fn (Collection $c) => $c->filter(fn ($b) => $b->status !== BookingStatus::Cancelled);

        $current = $completed($start, $end);
        $previous = $prevStart ? $completed($prevStart, $start) : null;
        $periodBookings = $created($start, $end);
        $rated = $live($periodBookings)->whereNotNull('rating');
        $windowDays = max(1, (int) ceil($start->diffInHours($end) / 24));
        $growth = fn (float $now, ?float $before) => $before === null || $before == 0 ? null : round(($now - $before) / $before * 100, 1);

        $bucketSeries = collect($buckets)->map(function (array $b) use ($completed, $created, $live, $payouts, $payments, $customers, $firstBookings, $in) {
            [$label, $from, $to] = $b;
            $bookers = $live($created($from, $to))->pluck('customer_id')->filter()->unique();
            $returning = $bookers->filter(fn ($id) => isset($firstBookings[$id]) && Carbon::parse($firstBookings[$id]->first_at)->lt($from));

            return [
                'label' => $label,
                'gross' => (int) $completed($from, $to)->sum('amount'),
                'net' => (int) $completed($from, $to)->sum('commission'),
                'payouts' => (int) $payouts->filter(fn ($p) => $in($p->paid_at, $from, $to))->sum('net'),
                'refunds' => (int) $payments->filter(fn ($p) => $in($p->refunded_at, $from, $to))->sum('amount'),
                'bookings' => $created($from, $to)->count(),
                'signups' => $customers->filter(fn ($u) => $in($u->created_at, $from, $to))->count(),
                'bookers' => $bookers->count(),
                'returning' => $returning->count(),
            ];
        });

        $utilization = fn (Collection $vehicleIds) => $this->utilization($bookings, $vehicleIds, $start, $end, $windowDays);
        $byMethod = $current->groupBy(fn ($p) => $p->method->value)->map(fn ($g) => (int) $g->sum('amount'))->sortDesc();
        $gross = (int) $current->sum('amount');
        $paymentDealer = $current->groupBy('dealer_id');
        $previousDealer = $previous?->groupBy('dealer_id');

        return response()->json([
            'period' => $period,
            'from' => $start->toIso8601String(),
            'kpis' => [
                'grossRevenue' => $gross,
                'revenueGrowth' => $growth($gross, $previous?->sum('amount')),
                'netCommission' => (int) $current->sum('commission'),
                'commGrowth' => $growth((float) $current->sum('commission'), $previous?->sum('commission')),
                'commissionShare' => $gross > 0 ? round($current->sum('commission') / $gross * 100, 1) : null,
                'bookings' => $periodBookings->count(),
                'bookingsGrowth' => $growth($periodBookings->count(), $prevStart ? $created($prevStart, $start)->count() : null),
                'avgRental' => round((float) $live($periodBookings)->avg('days'), 1),
                'cancellations' => $periodBookings->isEmpty() ? 0 : round($periodBookings->where('status', BookingStatus::Cancelled)->count() / $periodBookings->count() * 100, 1),
                'users' => $customers->count(),
                'newUsers' => $customers->filter(fn ($u) => $in($u->created_at, $start, $end))->count(),
                'usersGrowth' => $growth($customers->filter(fn ($u) => $in($u->created_at, $start, $end))->count(),
                    $prevStart ? $customers->filter(fn ($u) => $in($u->created_at, $prevStart, $start))->count() : null),
                'vehicles' => $vehicles->count(),
                'utilization' => $utilization($vehicles->pluck('id')),
                'rating' => $rated->isEmpty() ? null : round((float) $rated->avg('rating'), 1),
                'ratingCount' => $rated->count(),
            ],
            'series' => $bucketSeries->values(),
            'vehicleTypes' => $vehicles->groupBy('type')->map(fn (Collection $group, string $type) => [
                'type' => $type,
                'count' => $group->count(),
                'pct' => round($group->count() / max(1, $vehicles->count()) * 100, 1),
                'revenue' => (int) $current->filter(fn ($p) => $group->pluck('id')->contains($bookingVehicle[$p->booking_id] ?? null))->sum('amount'),
                'utilization' => $utilization($group->pluck('id')),
            ])->sortByDesc('count')->values(),
            'fleet' => [
                'total' => $vehicles->count(),
                'rented' => $vehicles->where('status', VehicleStatus::Rented)->count(),
                'available' => $vehicles->where('status', VehicleStatus::Available)->count(),
                'maintenance' => $vehicles->where('status', VehicleStatus::Maintenance)->count(),
                'suspended_dealer' => $vehicles->filter(fn ($v) => $v->dealer?->status === DealerStatus::Suspended)->count(),
            ],
            'topDealers' => $dealers->map(function (Dealer $d) use ($paymentDealer, $previousDealer, $periodBookings, $live, $vehicles, $utilization, $growth) {
                $dealerGross = (int) ($paymentDealer->get($d->id)?->sum('amount') ?? 0);
                $dealerRated = $live($periodBookings->where('dealer_id', $d->id))->whereNotNull('rating');
                $fleet = $vehicles->where('dealer_id', $d->id);

                return [
                    'id' => 'DLR-'.str_pad((string) $d->id, 3, '0', STR_PAD_LEFT),
                    'name' => $d->name,
                    'location' => $d->city,
                    'status' => $d->status->value,
                    'gross' => $dealerGross,
                    'rentals' => $live($periodBookings->where('dealer_id', $d->id))->count(),
                    'rating' => $dealerRated->isEmpty() ? null : round((float) $dealerRated->avg('rating'), 1),
                    'utilization' => $utilization($fleet->pluck('id')),
                    'fleet' => $fleet->count(),
                    'growth' => $previousDealer === null ? null : $growth($dealerGross, (float) ($previousDealer->get($d->id)?->sum('amount') ?? 0)),
                ];
            })->sortByDesc('gross')->values(),
            'geoRevenue' => $this->geography($dealers, $paymentDealer, $live($periodBookings), $gross),
            'paymentMethods' => $byMethod->map(fn (int $amount, string $method) => [
                'method' => $method,
                'amount' => $amount,
                'pct' => $gross > 0 ? round($amount / $gross * 100, 1) : 0,
            ])->values(),
            'bookingsByDay' => collect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])->map(fn ($day, $i) => [
                'day' => $day,
                'count' => $live($bookings)->filter(fn ($b) => $in($b->pickup_at, $start, $end) && $b->pickup_at->dayOfWeekIso === $i + 1)->count(),
            ]),
            'funnel' => [
                ['stage' => 'Registered', 'count' => $customers->count()],
                ['stage' => 'ID number on file', 'count' => $customers->whereNotNull('national_id')->count()],
                ['stage' => 'KYC verified', 'count' => $customers->where('kyc_status', 'verified')->count()],
                ['stage' => 'Booked once', 'count' => $customers->filter(fn ($u) => isset($firstBookings[$u->id]))->count()],
                ['stage' => 'Repeat booker', 'count' => $customers->filter(fn ($u) => ($firstBookings[$u->id]->total ?? 0) >= 2)->count()],
            ],
            'kyc' => collect(['verified', 'pending', 'rejected'])->mapWithKeys(fn ($s) => [$s => $customers->where('kyc_status', $s)->count()]),
            'alerts' => $alerts->current(),
        ]);
    }

    /**
     * @return array{0: CarbonInterface, 1: list<array{0: string, 1: CarbonInterface, 2: CarbonInterface}>}
     */
    private function window(string $period, CarbonInterface $end): array
    {
        $daily = fn (CarbonInterface $from, int $days, int $step, string $format) => collect(range(0, intdiv($days - 1, $step)))
            ->map(fn ($i) => [$from->copy()->addDays($i * $step)->format($format), $from->copy()->addDays($i * $step), $from->copy()->addDays(min(($i + 1) * $step, $days))])
            ->map(fn ($b) => [$b[0], $b[1], $b[2]->gt($end) ? $end->copy() : $b[2]])->all();
        $monthly = fn (CarbonInterface $from) => collect(range(0, (int) $from->diffInMonths($end->copy()->startOfMonth())))
            ->map(fn ($i) => [$from->copy()->addMonthsNoOverflow($i)->format($from->year === $end->year ? 'M' : 'M y'),
                $from->copy()->addMonthsNoOverflow($i), $from->copy()->addMonthsNoOverflow($i + 1)->min($end)])->all();

        return match ($period) {
            '7d' => [$start = today()->subDays(6), $daily($start, 7, 1, 'D j')],
            '30d' => [$start = today()->subDays(29), $daily($start, 30, 6, 'M j')],
            'ytd' => [$start = today()->startOfYear(), $monthly($start)],
            'all' => [$start = $this->earliest()->startOfMonth()->max(today()->startOfMonth()->subMonths(23)), $monthly($start)],
            default => [$start = today()->startOfMonth()->subMonthsNoOverflow(5), $monthly($start)],
        };
    }

    private function earliest(): Carbon
    {
        $dates = array_filter([Payment::min('paid_at'), Booking::min('created_at'), User::min('created_at')]);

        return $dates ? Carbon::parse(min($dates)) : today();
    }

    /** Share of vehicle-days in the window that were out on a (non-cancelled) booking. */
    private function utilization(Collection $bookings, Collection $vehicleIds, CarbonInterface $start, CarbonInterface $end, int $days): float
    {
        if ($vehicleIds->isEmpty()) {
            return 0;
        }
        $ids = $vehicleIds->flip();
        $hours = $bookings->filter(fn ($b) => $b->status !== BookingStatus::Cancelled && isset($ids[$b->vehicle_id]))
            ->sum(function ($b) use ($start, $end) {
                $from = $b->pickup_at->max($start);
                $to = $b->return_at->min($end);

                return $to->gt($from) ? $from->diffInHours($to) : 0;
            });

        return min(100, round($hours / ($vehicleIds->count() * $days * 24) * 100, 1));
    }

    /** @return list<array{county: string, revenue: int, bookings: int, share: float}> */
    private function geography(Collection $dealers, Collection $paymentsByDealer, Collection $bookings, int $gross): array
    {
        $rows = $dealers->groupBy(fn (Dealer $d) => trim(str_replace('County', '', (string) ($d->county ?: $d->city ?: 'Unknown'))))
            ->map(fn (Collection $group, string $county) => [
                'county' => $county,
                'revenue' => (int) $group->sum(fn (Dealer $d) => $paymentsByDealer->get($d->id)?->sum('amount') ?? 0),
                'bookings' => $bookings->whereIn('dealer_id', $group->pluck('id'))->count(),
            ])->sortByDesc('revenue')->values();

        $top = $rows->take(4);
        if ($rows->count() > 4) {
            $rest = $rows->slice(4);
            $top->push(['county' => 'Others', 'revenue' => $rest->sum('revenue'), 'bookings' => $rest->sum('bookings')]);
        }

        return $top->map(fn ($r) => [...$r, 'share' => $gross > 0 ? round($r['revenue'] / $gross * 100, 1) : 0])->all();
    }
}
