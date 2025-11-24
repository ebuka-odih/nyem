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

    public function pendingRequests(Request $request)
    {
        $user = $request->user();
        
        // Get all items owned by the current user
        $userItemIds = $user->items()->pluck('id');
        
        if ($userItemIds->isEmpty()) {
            return response()->json(['requests' => []]);
        }
        
        // Get all right swipes on user's items
        $swipes = Swipe::whereIn('target_item_id', $userItemIds)
            ->where('direction', 'right')
            ->where('from_user_id', '!=', $user->id)
            ->with(['fromUser', 'targetItem'])
            ->latest()
            ->get();
        
        // Get existing matches to filter out already matched users
        $existingMatches = UserMatch::forUser($user->id)->get();
        $matchedUserIds = $existingMatches->map(function ($match) use ($user) {
            return $match->otherUserId($user->id);
        })->filter()->unique()->values();
        
        // Filter out swipes from users who are already matched or blocked
        $blockedUserIds = $this->blockedUserIds($user);
        
        $pendingRequests = $swipes->filter(function ($swipe) use ($matchedUserIds, $blockedUserIds) {
            return !$matchedUserIds->contains($swipe->from_user_id) 
                && !in_array($swipe->from_user_id, $blockedUserIds);
        })->map(function ($swipe) use ($user) {
            // Get the other user's items that the current user can swipe on
            $otherUserItems = Item::where('user_id', $swipe->from_user_id)
                ->where('status', 'active')
                ->whereNotIn('id', function ($query) use ($user) {
                    $query->select('target_item_id')
                        ->from('swipes')
                        ->where('from_user_id', $user->id);
                })
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'title' => $item->title,
                        'photos' => $item->photos,
                        'condition' => $item->condition,
                        'category' => $item->category,
                        'looking_for' => $item->looking_for,
                    ];
                });
            
            return [
                'id' => $swipe->id,
                'from_user' => [
                    'id' => $swipe->fromUser->id,
                    'username' => $swipe->fromUser->username,
                    'profile_photo' => $swipe->fromUser->profile_photo,
                    'city' => $swipe->fromUser->city,
                ],
                'target_item' => [
                    'id' => $swipe->targetItem->id,
                    'title' => $swipe->targetItem->title,
                    'photos' => $swipe->targetItem->photos,
                    'condition' => $swipe->targetItem->condition,
                ],
                'other_user_items' => $otherUserItems,
                'created_at' => $swipe->created_at,
            ];
        })->filter(function ($request) {
            // Only include requests where there are items to swipe on
            return count($request['other_user_items']) > 0;
        })->values();
        
        return response()->json(['requests' => $pendingRequests]);
    }
}
