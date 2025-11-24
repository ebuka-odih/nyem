<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    protected function blockedUserIds(User $user): array
    {
        return Block::where('blocker_id', $user->id)->pluck('blocked_user_id')
            ->merge(
                Block::where('blocked_user_id', $user->id)->pluck('blocker_id')
            )
            ->unique()
            ->all();
    }

    protected function isBlockedBetween(User $user, string $otherUserId): bool
    {
        return Block::where(function ($query) use ($user, $otherUserId) {
            $query->where('blocker_id', $user->id)
                ->where('blocked_user_id', $otherUserId);
        })->orWhere(function ($query) use ($user, $otherUserId) {
            $query->where('blocker_id', $otherUserId)
                ->where('blocked_user_id', $user->id);
        })->exists();
    }
}
