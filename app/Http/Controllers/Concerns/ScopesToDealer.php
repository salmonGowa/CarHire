<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Dealer-operations records (maintenance, drivers, promotions...) belong to a
 * dealership: its staff manage them, super admins can see everything.
 */
trait ScopesToDealer
{
    protected function authorizeStaff(User $user): void
    {
        abort_unless($user->isSuperAdmin() || ($user->isDealer() && $user->dealer_id !== null), 403);
    }

    /** Writes are made by the dealership's own staff. */
    protected function authorizeDealerStaff(User $user): void
    {
        abort_unless($user->isDealer() && $user->dealer_id !== null, 403, 'Only dealership staff can make changes here.');
    }

    /**
     * @template T of Model
     *
     * @param  Builder<T>  $query
     * @return Builder<T>
     */
    protected function scopeToDealer(Builder $query, User $user): Builder
    {
        return $user->isSuperAdmin() ? $query : $query->where($query->getModel()->getTable().'.dealer_id', $user->dealer_id);
    }

    protected function authorizeOwns(User $user, Model $model): void
    {
        abort_unless($user->isDealer() && $model->getAttribute('dealer_id') === $user->dealer_id, 403);
    }
}
