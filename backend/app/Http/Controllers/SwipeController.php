<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Swipe;
use App\Models\UserMatch;
use Illuminate\Http\Request;

class SwipeController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'target_item_id' => 'required|exists:items,id',
            'direction' => 'required|in:left,right',
        ]);

        $user = $request->user();
        $item = Item::with('user')->findOrFail($data['target_item_id']);

        if (!$item->user_id || !$item->user) {
            return response()->json(['message' => 'Item owner not found'], 404);
        }

        if ($item->user_id === $user->id) {
            return response()->json(['message' => 'Cannot swipe on your own item'], 422);
        }

        if ($this->isBlockedBetween($user, $item->user_id)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $swipe = Swipe::updateOrCreate(
            [
                'from_user_id' => $user->id,
                'target_item_id' => $item->id,
            ],
            [
                'direction' => $data['direction'],
            ]
        );

        $match = null;
        $matchCreated = false;

        if ($data['direction'] === 'right') {
            $userItemIds = $user->items()->pluck('id');
            $reciprocal = Swipe::where('from_user_id', $item->user_id)
                ->whereIn('target_item_id', $userItemIds)
                ->where('direction', 'right')
                ->latest()
                ->first();

            if ($reciprocal) {
                // For UUIDs, use string comparison for consistent ordering
                $userIds = [$user->id, $item->user_id];
                sort($userIds);
                $firstUserId = $userIds[0];
                $secondUserId = $userIds[1];

                $firstItemId = $firstUserId === $user->id ? $reciprocal->target_item_id : $item->id;
                $secondItemId = $firstUserId === $user->id ? $item->id : $reciprocal->target_item_id;

                $match = UserMatch::firstOrCreate([
                    'user1_id' => $firstUserId,
                    'user2_id' => $secondUserId,
                    'item1_id' => $firstItemId,
                    'item2_id' => $secondItemId,
                ]);

                $matchCreated = $match->wasRecentlyCreated;
            }
        }

        return response()->json([
            'swipe' => $swipe,
            'match' => $match,
            'match_created' => $matchCreated,
        ]);
    }
}
