<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Enums\MaintenanceStatus;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Concerns\ScopesToDealer;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceTask;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MaintenanceController extends Controller
{
    use ScopesToDealer;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeStaff($user);
        $base = fn () => $this->scopeToDealer(MaintenanceTask::query(), $user);
        $open = fn () => $base()->where('status', '!=', MaintenanceStatus::Completed);

        $tasks = $base()
            ->with('vehicle')
            ->when($request->input('view') === 'history',
                fn ($q) => $q->where('status', MaintenanceStatus::Completed)->orderByDesc('completed_at'),
                fn ($q) => $q->where('status', '!=', MaintenanceStatus::Completed)->orderBy('due_date'))
            ->limit(200)
            ->get();

        return response()->json([
            'data' => $tasks->map(fn (MaintenanceTask $t) => $this->present($t)),
            'summary' => [
                'critical_open' => $open()->where('priority', 'high')->count(),
                'due_next_7_days' => $open()->whereBetween('due_date', [today(), today()->addDays(7)])->count(),
                'overdue' => $open()->where('due_date', '<', today())->count(),
                'completed_this_month' => $base()->where('status', MaintenanceStatus::Completed)->where('completed_at', '>=', now()->startOfMonth())->count(),
                'cost_this_month' => (int) $base()->where('status', MaintenanceStatus::Completed)->where('completed_at', '>=', now()->startOfMonth())->sum('cost'),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeDealerStaff($user);
        $data = $this->validated($request, $user->dealer_id);

        $task = MaintenanceTask::create([...$data, 'dealer_id' => $user->dealer_id, 'created_by' => $user->id, 'status' => MaintenanceStatus::Scheduled]);

        return response()->json(['data' => $this->present($task->load('vehicle'))], 201);
    }

    public function update(Request $request, MaintenanceTask $task): JsonResponse
    {
        $this->authorizeOwns($request->user(), $task);
        abort_if($task->status === MaintenanceStatus::Completed, 422, 'Completed jobs are part of the service history and can no longer be edited.');

        $task->update($this->validated($request, $task->dealer_id));

        return response()->json(['data' => $this->present($task->load('vehicle'))]);
    }

    /**
     * Start or finish a job. Starting takes the car off the road; finishing
     * returns it unless another job is still in progress on it.
     */
    public function transition(Request $request, MaintenanceTask $task): JsonResponse
    {
        $this->authorizeOwns($request->user(), $task);
        $data = $request->validate([
            'status' => ['required', Rule::enum(MaintenanceStatus::class)],
            'cost' => ['nullable', 'integer', 'min:0', 'max:10000000'],
        ]);
        $next = MaintenanceStatus::from($data['status']);

        if (! in_array($next, $task->status->allowedTransitions(), true)) {
            throw ValidationException::withMessages(['status' => "A {$task->status->value} job can't be marked {$next->value}."]);
        }

        DB::transaction(function () use ($task, $next, $data) {
            $vehicle = Vehicle::withTrashed()->lockForUpdate()->find($task->vehicle_id);

            if ($next === MaintenanceStatus::InProgress) {
                if ($vehicle->bookings()->where('status', BookingStatus::Active)->exists()) {
                    throw ValidationException::withMessages(['status' => "{$vehicle->plate} is out on a rental. Start the job once it's returned."]);
                }
                $vehicle->update(['status' => VehicleStatus::Maintenance]);
                $task->started_at = now();
            }

            if ($next === MaintenanceStatus::Completed) {
                $task->completed_at = now();
                $task->cost = $data['cost'] ?? $task->cost;
                $othersRunning = MaintenanceTask::where('vehicle_id', $vehicle->id)->whereKeyNot($task->id)
                    ->where('status', MaintenanceStatus::InProgress)->exists();
                if ($vehicle->status === VehicleStatus::Maintenance && ! $othersRunning) {
                    $vehicle->update(['status' => VehicleStatus::Available]);
                }
            }

            $task->status = $next;
            $task->save();
        });

        return response()->json(['data' => $this->present($task->fresh('vehicle'))]);
    }

    public function destroy(Request $request, MaintenanceTask $task): Response
    {
        $this->authorizeOwns($request->user(), $task);
        abort_unless($task->status === MaintenanceStatus::Scheduled, 422, 'Only jobs that haven\'t started can be deleted.');
        $task->delete();

        return response()->noContent();
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, int $dealerId): array
    {
        return $request->validate([
            'vehicle_id' => ['required', 'integer', Rule::exists('vehicles', 'id')->where('dealer_id', $dealerId)->whereNull('deleted_at')],
            'service' => ['required', 'string', 'max:120'],
            'due_date' => ['required', 'date'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'cost' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'notes' => ['nullable', 'string', 'max:255'],
        ], ['vehicle_id.exists' => 'Choose a vehicle from your own fleet.']);
    }

    /** @return array<string, mixed> */
    private function present(MaintenanceTask $t): array
    {
        return [
            'id' => $t->id,
            'reference' => 'MT-'.str_pad((string) $t->id, 4, '0', STR_PAD_LEFT),
            'vehicle' => $t->vehicle ? ['id' => $t->vehicle->id, 'model' => $t->vehicle->model, 'plate' => $t->vehicle->plate, 'status' => $t->vehicle->status->value] : null,
            'service' => $t->service,
            'due_date' => $t->due_date->toDateString(),
            'is_overdue' => $t->status !== MaintenanceStatus::Completed && $t->due_date->lt(today()),
            'priority' => $t->priority,
            'status' => $t->status->value,
            'cost' => $t->cost,
            'notes' => $t->notes,
            'started_at' => $t->started_at?->toIso8601String(),
            'completed_at' => $t->completed_at?->toIso8601String(),
            'allowed_transitions' => array_map(fn ($s) => $s->value, $t->status->allowedTransitions()),
        ];
    }
}
