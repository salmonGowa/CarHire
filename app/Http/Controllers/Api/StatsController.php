<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    /**
     * Headline numbers for dashboards, scoped to what the user can see.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $bookings = fn () => Booking::query()->visibleTo($user);
        $notCancelled = fn ($q) => $q->where('status', '!=', BookingStatus::Cancelled);

        $stats = [
            'bookings' => [
                'pending' => $bookings()->where('status', BookingStatus::Pending)->count(),
                'confirmed' => $bookings()->where('status', BookingStatus::Confirmed)->count(),
                'active' => $bookings()->where('status', BookingStatus::Active)->count(),
                'overdue' => $bookings()->where('status', BookingStatus::Active)->where('return_at', '<', now())->count(),
                'completed' => $bookings()->where('status', BookingStatus::Completed)->count(),
                'completed_today' => $bookings()->where('status', BookingStatus::Completed)->whereDate('updated_at', today())->count(),
                'cancelled_today' => $bookings()->where('status', BookingStatus::Cancelled)->whereDate('cancelled_at', today())->count(),
                'upcoming_pickups' => $bookings()->whereIn('status', [BookingStatus::Pending, BookingStatus::Confirmed])
                    ->whereBetween('pickup_at', [now(), now()->addDays(7)])->count(),
                'next_pickup_at' => $bookings()->whereIn('status', [BookingStatus::Pending, BookingStatus::Confirmed])
                    ->where('pickup_at', '>=', now())->min('pickup_at'),
            ],
            'revenue' => [
                'booked_today' => (int) $bookings()->tap($notCancelled)->whereDate('created_at', today())->sum('total'),
                'month_to_date' => (int) $bookings()->tap($notCancelled)
                    ->whereBetween('pickup_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total'),
                'active_value' => (int) $bookings()->where('status', BookingStatus::Active)->sum('total'),
            ],
        ];

        if ($user->isSuperAdmin() || $user->isDealer()) {
            $vehicles = Vehicle::query()->when(! $user->isSuperAdmin(), fn ($q) => $q->where('dealer_id', $user->dealer_id));
            $counts = (clone $vehicles)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

            $stats['vehicles'] = [
                'total' => (int) $counts->sum(),
                'available' => (int) ($counts[VehicleStatus::Available->value] ?? 0),
                'rented' => (int) ($counts[VehicleStatus::Rented->value] ?? 0),
                'maintenance' => (int) ($counts[VehicleStatus::Maintenance->value] ?? 0),
            ];
        }

        if ($user->isSuperAdmin()) {
            $stats['platform'] = [
                'dealers' => Dealer::count(),
                'customers' => User::where('role', UserRole::Customer)->count(),
            ];
        }

        if (! $user->isSuperAdmin() && ! $user->isDealer()) {
            $completed = $bookings()->where('status', BookingStatus::Completed);
            $stats['trips'] = [
                'completed' => (clone $completed)->count(),
                'total_spent' => (int) (clone $completed)->sum('total'),
                'days' => (int) (clone $completed)->sum('days'),
                'average_rating' => round((float) (clone $completed)->whereNotNull('rating')->avg('rating'), 1),
            ];
        }

        return response()->json($stats);
    }
}
