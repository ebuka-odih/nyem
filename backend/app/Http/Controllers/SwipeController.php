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

        \Log::info('Creating swipe', [
            'from_user_id' => $user->id,
            'target_item_id' => $item->id,
            'item_owner_id' => $item->user_id,
            'direction' => $data['direction'],
        ]);

        $swipe = Swipe::updateOrCreate(
            [
                'from_user_id' => $user->id,
                'target_item_id' => $item->id,
            ],
            [
                'direction' => $data['direction'],
            ]
        );

        \Log::info('Swipe created/updated', [
            'swipe_id' => $swipe->id,
            'from_user_id' => $swipe->from_user_id,
            'target_item_id' => $swipe->target_item_id,
            'direction' => $swipe->direction,
        ]);

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
            return response()->json([
                'requests' => [],
                'debug' => [
                    'user_id' => $user->id,
                    'user_items_count' => 0,
                    'message' => 'User has no items, so no match requests can exist',
                ],
            ]);
        }
        
        // Get all right swipes on user's items
        $swipes = Swipe::whereIn('target_item_id', $userItemIds)
            ->where('direction', 'right')
            ->where('from_user_id', '!=', $user->id)
            ->with(['fromUser', 'targetItem'])
            ->latest()
            ->get();
        
        // Get existing matches to mark matched users (but don't filter them out)
        $existingMatches = UserMatch::forUser($user->id)->get();
        $matchedUserIds = $existingMatches->map(function ($match) use ($user) {
            return $match->otherUserId($user->id);
        })->filter()->unique()->values();
        
        // Get items that the current user has already swiped on
        $swipedItemIds = Swipe::where('from_user_id', $user->id)
            ->pluck('target_item_id')
            ->toArray();
        
        // Filter out swipes from blocked users and items already swiped on
        $blockedUserIds = $this->blockedUserIds($user);
        
        $allSwipesCount = $swipes->count();
        
        $pendingRequests = $swipes->filter(function ($swipe) use ($blockedUserIds, $swipedItemIds) {
            // Check if user exists (in case of deleted users)
            if (!$swipe->fromUser || !$swipe->targetItem) {
                return false;
            }
            
            // Filter out blocked users
            if (in_array($swipe->from_user_id, $blockedUserIds)) {
                return false;
            }
            
            // Filter out items that the current user has already swiped on
            // (This prevents showing requests for items you've already responded to)
            if (in_array($swipe->target_item_id, $swipedItemIds)) {
                return false;
            }
            
            return true;
        })->map(function ($swipe) use ($user, $matchedUserIds) {
            // Get the other user's items that the current user can swipe on
            // Get items that haven't been swiped on yet by the current user
            $userSwipedItemIds = Swipe::where('from_user_id', $user->id)
                ->pluck('target_item_id')
                ->toArray();
            
            $otherUserItems = Item::where('user_id', $swipe->from_user_id)
                ->where('status', 'active')
                ->whereNotIn('id', $userSwipedItemIds)
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
            
            // Check if this user is already matched
            $isMatched = $matchedUserIds->contains($swipe->from_user_id);
            
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
                'is_matched' => $isMatched,
                'created_at' => $swipe->created_at,
            ];
        })->values();
        
        // Always return debug info to help diagnose issues
        $debugInfo = [
            'user_id' => $user->id,
            'username' => $user->username,
            'user_items_count' => $userItemIds->count(),
            'user_item_ids' => $userItemIds->toArray(),
            'total_swipes_on_user_items' => $allSwipesCount,
            'matched_user_ids' => $matchedUserIds->toArray(),
            'blocked_user_ids' => $blockedUserIds,
            'pending_requests_count' => $pendingRequests->count(),
            'all_swipes_details' => $swipes->map(function ($swipe) {
                return [
                    'swipe_id' => $swipe->id,
                    'from_user_id' => $swipe->from_user_id,
                    'target_item_id' => $swipe->target_item_id,
                    'direction' => $swipe->direction,
                    'has_from_user' => $swipe->fromUser ? true : false,
                    'has_target_item' => $swipe->targetItem ? true : false,
                ];
            })->toArray(),
        ];
        
        // Also check all swipes in the database for debugging
        $allSwipes = Swipe::with(['fromUser', 'targetItem'])->get()->map(function ($swipe) {
            return [
                'id' => $swipe->id,
                'from_user_id' => $swipe->from_user_id,
                'target_item_id' => $swipe->target_item_id,
                'direction' => $swipe->direction,
                'created_at' => $swipe->created_at,
            ];
        });

        $debugInfo['all_swipes_in_database'] = $allSwipes->toArray();
        $debugInfo['all_swipes_count'] = $allSwipes->count();

        return response()->json([
            'requests' => $pendingRequests,
            'debug' => $debugInfo,
        ]);
    }
}
