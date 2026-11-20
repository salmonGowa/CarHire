<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Dealer;
use App\Models\Driver;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The top-bar search. Each role only searches what it can already see, and
 * every result links to the page that shows it.
 */
class SearchController extends Controller
{
    private const PER_GROUP = 5;

    public function __invoke(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q'));
        if (mb_strlen($q) < 2) {
            return response()->json(['data' => []]);
        }
        $user = $request->user();
        $like = '%'.addcslashes($q, '%_\\').'%';

        $groups = match ($user->role) {
            UserRole::SuperAdmin => [
                'Dealers' => $this->dealers($like),
                'Clients' => $this->clients($like),
                'Bookings' => $this->bookings(Booking::query(), $like, '/superadmin-rentals'),
                'Vehicles' => $this->vehicles(Vehicle::query(), $like, '/superadmin-fleet'),
                'Invoices' => $this->invoices(Invoice::query(), $like, '/superadmin-revenue'),
                'Support tickets' => $this->tickets(SupportTicket::query(), $like, '/superadmin-support'),
            ],
            UserRole::Dealer => $user->dealer_id ? [
                'Bookings' => $this->bookings(Booking::where('dealer_id', $user->dealer_id), $like, '/dealer-booking'),
                'Vehicles' => $this->vehicles(Vehicle::where('dealer_id', $user->dealer_id), $like, '/dealer-fleet'),
                'Drivers' => Driver::where('dealer_id', $user->dealer_id)
                    ->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('phone', 'like', $like)->orWhere('license_number', 'like', $like))
                    ->limit(self::PER_GROUP)->get()
                    ->map(fn (Driver $d) => $this->row($d->name, $d->phone, '/dealer-drivers')),
                'Invoices' => $this->invoices(Invoice::where('dealer_id', $user->dealer_id), $like, '/dealer-invoices'),
                'Support tickets' => $this->tickets(SupportTicket::where('dealer_id', $user->dealer_id), $like, '/dealer-support'),
            ] : [],
            UserRole::Hr => [
                'Employees' => Employee::where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like)->orWhere('job_title', 'like', $like))
                    ->limit(self::PER_GROUP)->get()
                    ->map(fn (Employee $e) => $this->row($e->name, "{$e->job_title} · {$e->department}", '/hrstaff')),
            ],
            UserRole::Customer => [
                'My bookings' => $this->bookings(Booking::where('customer_id', $user->id), $like, '/customer-rentals'),
                'Vehicles to rent' => Vehicle::bookable()->with('dealer')
                    ->where(fn ($w) => $w->where('model', 'like', $like)->orWhere('type', 'like', $like))
                    ->limit(self::PER_GROUP)->get()
                    ->map(fn (Vehicle $v) => $this->row($v->model, "{$v->type} · KSh ".number_format($v->daily_rate)."/day · {$v->dealer?->name}", '/customer-browse')),
                'Invoices' => $this->invoices(Invoice::where('customer_id', $user->id), $like, '/customer-billing'),
                'Support tickets' => $this->tickets(SupportTicket::where('user_id', $user->id), $like, '/customer-support'),
            ],
        };

        return response()->json(['data' => collect($groups)
            ->map(fn ($rows, $label) => ['group' => $label, 'results' => collect($rows)->values()])
            ->filter(fn ($g) => $g['results']->isNotEmpty())
            ->values()]);
    }

    private function dealers(string $like)
    {
        return Dealer::where(fn ($w) => $w->where('name', 'like', $like)->orWhere('city', 'like', $like)->orWhere('owner_name', 'like', $like))
            ->limit(self::PER_GROUP)->get()
            ->map(fn (Dealer $d) => $this->row($d->name, trim("{$d->city} · {$d->status->value}", ' ·'), "/superadmin-dealers?open={$d->id}"));
    }

    private function clients(string $like)
    {
        return User::where('role', UserRole::Customer)
            ->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like)->orWhere('phone', 'like', $like)->orWhere('national_id', 'like', $like))
            ->limit(self::PER_GROUP)->get()
            ->map(fn (User $u) => $this->row($u->name, $u->email, "/superadmin-clients?open={$u->id}"));
    }

    /** @param Builder<Booking> $query */
    private function bookings(Builder $query, string $like, string $link)
    {
        return $query->with('vehicle')
            ->where(fn ($w) => $w->where('reference', 'like', $like)->orWhere('customer_name', 'like', $like)->orWhere('customer_phone', 'like', $like)
                ->orWhereHas('vehicle', fn ($v) => $v->where('plate', 'like', $like)->orWhere('model', 'like', $like)))
            ->latest('pickup_at')->limit(self::PER_GROUP)->get()
            ->map(fn (Booking $b) => $this->row("{$b->reference} · {$b->customer_name}",
                ($b->vehicle?->model ?? 'Vehicle').' · '.$b->pickup_at->format('j M Y').' · '.$b->status->value, $link));
    }

    /** @param Builder<Vehicle> $query */
    private function vehicles(Builder $query, string $like, string $link)
    {
        return $query->where(fn ($w) => $w->where('plate', 'like', $like)->orWhere('model', 'like', $like))
            ->limit(self::PER_GROUP)->get()
            ->map(fn (Vehicle $v) => $this->row("{$v->model} · {$v->plate}", "{$v->type} · {$v->status->value}", $link));
    }

    /** @param Builder<Invoice> $query */
    private function invoices(Builder $query, string $like, string $link)
    {
        return $query->where(fn ($w) => $w->where('number', 'like', $like)->orWhere('customer_name', 'like', $like))
            ->latest('issued_at')->limit(self::PER_GROUP)->get()
            ->map(fn (Invoice $i) => $this->row("{$i->number} · {$i->customer_name}", 'KSh '.number_format($i->total).' · '.$i->status(), $link));
    }

    /** @param Builder<SupportTicket> $query */
    private function tickets(Builder $query, string $like, string $link)
    {
        return $query->where(fn ($w) => $w->where('reference', 'like', $like)->orWhere('subject', 'like', $like))
            ->latest('last_activity_at')->limit(self::PER_GROUP)->get()
            ->map(fn (SupportTicket $t) => $this->row("{$t->reference} · {$t->subject}", str_replace('_', ' ', $t->status), "{$link}?ticket={$t->id}"));
    }

    /** @return array{title: string, subtitle: string|null, link: string} */
    private function row(string $title, ?string $subtitle, string $link): array
    {
        return ['title' => $title, 'subtitle' => $subtitle, 'link' => $link];
    }
}
