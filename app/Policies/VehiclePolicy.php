<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vehicle;

class VehiclePolicy
{
    /**
     * Fleet management is for super admins and dealer staff with a dealership.
     */
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || ($user->isDealer() && $user->dealer_id !== null);
    }

    public function view(User $user, Vehicle $vehicle): bool
    {
        return $this->owns($user, $vehicle);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, Vehicle $vehicle): bool
    {
        return $this->owns($user, $vehicle);
    }

    public function delete(User $user, Vehicle $vehicle): bool
    {
        return $this->owns($user, $vehicle);
    }

    private function owns(User $user, Vehicle $vehicle): bool
    {
        return $user->isSuperAdmin() || ($user->isDealer() && $user->dealer_id === $vehicle->dealer_id);
    }
}
