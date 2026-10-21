<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Support tickets. Super admins work the whole queue; dealer staff see their
 * dealership's tickets; everyone else sees the tickets they raised.
 * Internal notes are only visible to super admins.
 */
class SupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', Rule::in(['active', 'all', ...SupportTicket::STATUSES])],
            'priority' => ['nullable', Rule::in(SupportTicket::PRIORITIES)],
            'origin' => ['nullable', Rule::in(['customer', 'dealer'])],
        ]);
        $user = $request->user();
        $status = $request->input('status', 'all');

        $tickets = $this->visible($user)
            ->with(['user', 'dealer', 'booking', 'assignee'])
            ->withCount(['messages' => fn ($q) => $user->isSuperAdmin() ? $q : $q->where('internal', false)])
            ->when($status === 'active', fn ($q) => $q->whereIn('status', ['open', 'in_progress']))
            ->when(! in_array($status, ['active', 'all'], true), fn ($q) => $q->where('status', $status))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->input('priority')))
            ->when($request->input('origin') === 'dealer', fn ($q) => $q->whereNotNull('dealer_id'))
            ->when($request->input('origin') === 'customer', fn ($q) => $q->whereNull('dealer_id'))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($q) => $q->where('subject', 'like', $term)->orWhere('reference', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term))
                    ->orWhereHas('dealer', fn ($d) => $d->where('name', 'like', $term)));
            })
            // Urgent work first, then whatever moved most recently.
            ->orderByRaw("case when status in ('open', 'in_progress') then 0 else 1 end")
            ->orderByRaw("case priority when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end")
            ->latest('last_activity_at')->latest('id')
            ->limit(300)->get();

        return response()->json([
            'data' => $tickets->map(fn (SupportTicket $t) => $this->present($t)),
            'summary' => $this->summary($user),
            'categories' => SupportTicket::CATEGORIES,
            'agents' => $user->isSuperAdmin()
                ? User::where('role', UserRole::SuperAdmin)->whereNull('disabled_at')->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }

    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        $user = $request->user();
        $this->authorizeView($user, $ticket);
        $ticket->load(['user', 'dealer', 'booking.vehicle', 'assignee', 'messages.user']);

        return response()->json(['data' => [
            ...$this->present($ticket),
            'messages' => $ticket->messages
                ->filter(fn (SupportMessage $m) => $user->isSuperAdmin() || ! $m->internal)
                ->values()
                ->map(fn (SupportMessage $m) => [
                    'id' => $m->id,
                    'body' => $m->body,
                    'internal' => $m->internal,
                    'author' => $m->user?->name ?? 'Deleted user',
                    'from_support' => $m->user?->isSuperAdmin() ?? false,
                    'mine' => $m->user_id === $user->id,
                    'at' => $m->created_at->toIso8601String(),
                ]),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:150'],
            'category' => ['required', Rule::in(SupportTicket::CATEGORIES)],
            'priority' => ['nullable', Rule::in(SupportTicket::PRIORITIES)],
            'body' => ['required', 'string', 'max:5000'],
            'booking_id' => ['nullable', 'integer', 'exists:bookings,id'],
        ]);

        if (isset($data['booking_id'])) {
            $booking = Booking::findOrFail($data['booking_id']);
            $ownsBooking = $user->isSuperAdmin() || $booking->customer_id === $user->id || ($user->isDealer() && $booking->dealer_id === $user->dealer_id);
            abort_unless($ownsBooking, 422, 'That booking is not yours.');
        }

        $ticket = DB::transaction(function () use ($user, $data) {
            $ticket = SupportTicket::create([
                'user_id' => $user->id,
                'dealer_id' => $user->isDealer() ? $user->dealer_id : null,
                'booking_id' => $data['booking_id'] ?? null,
                'subject' => $data['subject'],
                'category' => $data['category'],
                // Roadside help can't wait behind billing questions.
                'priority' => $data['category'] === 'Roadside Assistance' ? 'urgent' : ($data['priority'] ?? 'medium'),
                'last_activity_at' => now(),
            ]);
            $ticket->messages()->create(['user_id' => $user->id, 'body' => $data['body']]);

            return $ticket;
        });

        AuditLog::record('support.opened', "Opened {$ticket->reference}: {$ticket->subject}", $ticket, $ticket->priority === 'urgent' ? 'warning' : 'info');

        return response()->json(['data' => $this->present($ticket->load(['user', 'dealer', 'booking', 'assignee'])->loadCount('messages'))], 201);
    }

    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $user = $request->user();
        $this->authorizeView($user, $ticket);
        $data = $request->validate(['body' => ['required', 'string', 'max:5000'], 'internal' => ['boolean']]);
        $internal = $user->isSuperAdmin() && ($data['internal'] ?? false);
        abort_if($ticket->status === 'closed' && ! $user->isSuperAdmin(), 422, 'This ticket is closed. Open a new one if you still need help.');

        DB::transaction(function () use ($ticket, $user, $data, $internal) {
            $ticket->messages()->create(['user_id' => $user->id, 'body' => $data['body'], 'internal' => $internal]);
            if ($internal) {
                return;
            }
            $changes = ['last_activity_at' => now()];
            if ($user->isSuperAdmin() && $ticket->user_id !== $user->id) {
                $changes['first_response_at'] = $ticket->first_response_at ?? now();
                if ($ticket->status === 'open') {
                    $changes['status'] = 'in_progress';
                }
            } elseif (in_array($ticket->status, ['resolved', 'closed'], true)) {
                // The reporter writing back means it isn't solved.
                $changes += ['status' => 'open', 'resolved_at' => null];
            }
            $ticket->update($changes);
        });

        return $this->show($request, $ticket->fresh());
    }

    public function update(Request $request, SupportTicket $ticket): JsonResponse
    {
        $user = $request->user();
        $this->authorizeView($user, $ticket);

        $data = $user->isSuperAdmin()
            ? $request->validate([
                'status' => ['sometimes', Rule::in(SupportTicket::STATUSES)],
                'priority' => ['sometimes', Rule::in(SupportTicket::PRIORITIES)],
                'assigned_to' => ['sometimes', 'nullable', Rule::exists('users', 'id')->where('role', UserRole::SuperAdmin->value)],
            ])
            // Reporters can only say their problem is solved.
            : $request->validate(['status' => ['required', Rule::in(['resolved', 'closed'])]]);

        if (isset($data['status']) && $data['status'] !== $ticket->status) {
            $data['resolved_at'] = in_array($data['status'], ['resolved', 'closed'], true) ? ($ticket->resolved_at ?? now()) : null;
            AuditLog::record('support.status', "{$ticket->reference} marked ".str_replace('_', ' ', $data['status']), $ticket);
        }
        $ticket->update([...$data, 'last_activity_at' => now()]);

        return $this->show($request, $ticket->fresh());
    }

    /** @return Builder<SupportTicket> */
    private function visible(User $user): Builder
    {
        return match (true) {
            $user->isSuperAdmin() => SupportTicket::query(),
            $user->isDealer() && $user->dealer_id !== null => SupportTicket::where('dealer_id', $user->dealer_id),
            default => SupportTicket::where('user_id', $user->id),
        };
    }

    private function authorizeView(User $user, SupportTicket $ticket): void
    {
        abort_unless($this->visible($user)->whereKey($ticket->id)->exists(), 404);
    }

    /** @return array<string, int|float|null> */
    private function summary(User $user): array
    {
        $base = fn () => $this->visible($user);
        $active = fn () => $base()->whereIn('status', ['open', 'in_progress']);
        $responded = $base()->whereNotNull('first_response_at')->where('created_at', '>=', now()->subDays(30))->get(['created_at', 'first_response_at']);

        return [
            'active' => $active()->count(),
            'urgent_high' => $active()->whereIn('priority', ['urgent', 'high'])->count(),
            'unassigned' => $active()->whereNull('assigned_to')->count(),
            'resolved_7_days' => $base()->whereIn('status', ['resolved', 'closed'])->where('resolved_at', '>=', now()->subDays(7))->count(),
            'avg_first_response_hours' => $responded->isEmpty() ? null
                : round($responded->avg(fn (SupportTicket $t) => $t->created_at->diffInMinutes($t->first_response_at)) / 60, 1),
        ];
    }

    /** @return array<string, mixed> */
    private function present(SupportTicket $t): array
    {
        return [
            'id' => $t->id,
            'reference' => $t->reference,
            'subject' => $t->subject,
            'category' => $t->category,
            'priority' => $t->priority,
            'status' => $t->status,
            'origin' => $t->dealer_id ? 'dealer' : ($t->user->role === UserRole::Customer ? 'customer' : 'staff'),
            'reporter' => ['id' => $t->user->id, 'name' => $t->user->name, 'email' => $t->user->email],
            'dealer' => $t->dealer?->name,
            'booking' => $t->booking ? ['id' => $t->booking->id, 'reference' => $t->booking->reference] : null,
            'assignee' => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name] : null,
            'messages_count' => $t->messages_count ?? null,
            'created_at' => $t->created_at->toIso8601String(),
            'last_activity_at' => ($t->last_activity_at ?? $t->created_at)->toIso8601String(),
            'first_response_at' => $t->first_response_at?->toIso8601String(),
            'resolved_at' => $t->resolved_at?->toIso8601String(),
        ];
    }
}
