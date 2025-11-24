<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Swipe;
use App\Models\TradeOffer;
use App\Models\UserMatch;
use App\Models\UserConversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SwipeController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'target_item_id' => 'required|exists:items,id',
            'direction' => 'required|in:left,right',
            'offered_item_id' => 'required_if:direction,right|nullable|exists:items,id',
        ]);

        $user = $request->user();
        $targetItem = Item::with('user')->findOrFail($data['target_item_id']);

        if (!$targetItem->user_id || !$targetItem->user) {
            return response()->json(['message' => 'Item owner not found'], 404);
        }

        if ($targetItem->user_id === $user->id) {
            return response()->json(['message' => 'Cannot swipe on your own item'], 422);
        }

        if ($this->isBlockedBetween($user, $targetItem->user_id)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        // For right swipes, validate that offered_item_id belongs to the user
        if ($data['direction'] === 'right') {
            if (empty($data['offered_item_id'])) {
                return response()->json(['message' => 'offered_item_id is required for right swipes'], 422);
            }

            $offeredItem = Item::findOrFail($data['offered_item_id']);
            if ($offeredItem->user_id !== $user->id) {
                return response()->json(['message' => 'offered_item_id must belong to you'], 422);
            }

            if ($offeredItem->id === $targetItem->id) {
                return response()->json(['message' => 'Cannot offer the same item you are swiping on'], 422);
            }
        }

        \Log::info('Creating swipe', [
            'from_user_id' => $user->id,
            'target_item_id' => $targetItem->id,
            'offered_item_id' => $data['offered_item_id'] ?? null,
            'item_owner_id' => $targetItem->user_id,
            'direction' => $data['direction'],
        ]);

        $match = null;
        $matchCreated = false;
        $tradeOffer = null;

        DB::transaction(function () use ($user, $targetItem, $data, &$swipe, &$match, &$matchCreated, &$tradeOffer) {
            // Check if there's an existing swipe (to handle direction changes)
            $existingSwipe = Swipe::where('from_user_id', $user->id)
                ->where('target_item_id', $targetItem->id)
                ->first();

            // If changing from right to left, decline any pending trade offers
            if ($existingSwipe && $existingSwipe->direction === 'right' && $data['direction'] === 'left') {
                TradeOffer::where('from_user_id', $user->id)
                    ->where('target_item_id', $targetItem->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'declined']);
            }

            // Create or update swipe
            $swipe = Swipe::updateOrCreate(
                [
                    'from_user_id' => $user->id,
                    'target_item_id' => $targetItem->id,
                ],
                [
                    'direction' => $data['direction'],
                    'offered_item_id' => $data['direction'] === 'right' ? $data['offered_item_id'] : null,
                ]
            );

            if ($data['direction'] === 'right') {
                // Create or update trade offer
                $tradeOffer = TradeOffer::firstOrCreate(
                    [
                        'from_user_id' => $user->id,
                        'to_user_id' => $targetItem->user_id,
                        'offered_item_id' => $data['offered_item_id'],
                        'target_item_id' => $targetItem->id,
                    ],
                    [
                        'status' => 'pending',
                    ]
                );

                // Check for reciprocal swipe
                // User B must have swiped right on User A's offered_item
                // AND User B's offered_item must be User A's target_item
                $reciprocal = Swipe::where('from_user_id', $targetItem->user_id)
                    ->where('target_item_id', $data['offered_item_id']) // User B swiped on User A's offered item
                    ->where('offered_item_id', $targetItem->id) // User B offered User A's target item
                    ->where('direction', 'right')
                    ->first();

                if ($reciprocal) {
                    // Create match
                    $userIds = [$user->id, $targetItem->user_id];
                    sort($userIds);
                    $firstUserId = $userIds[0];
                    $secondUserId = $userIds[1];

                    // Determine item IDs based on user order
                    $firstItemId = $firstUserId === $user->id ? $data['offered_item_id'] : $targetItem->id;
                    $secondItemId = $firstUserId === $user->id ? $targetItem->id : $data['offered_item_id'];

                    // Get or create conversation
                    $conversation = UserConversation::firstOrCreate(
                        [
                            'user1_id' => $firstUserId,
                            'user2_id' => $secondUserId,
                        ]
                    );

                    // Create match
                    $match = UserMatch::firstOrCreate(
                        [
                            'user1_id' => $firstUserId,
                            'user2_id' => $secondUserId,
                            'item1_id' => $firstItemId,
                            'item2_id' => $secondItemId,
                        ],
                        [
                            'conversation_id' => $conversation->id,
                        ]
                    );

                    $matchCreated = $match->wasRecentlyCreated;

                    // Update trade offer status if match was created
                    if ($matchCreated) {
                        $tradeOffer->update(['status' => 'accepted']);
                        
                        // Also update the reciprocal trade offer if it exists
                        $reciprocalTradeOffer = TradeOffer::where('from_user_id', $targetItem->user_id)
                            ->where('to_user_id', $user->id)
                            ->where('offered_item_id', $targetItem->id)
                            ->where('target_item_id', $data['offered_item_id'])
                            ->first();
                        
                        if ($reciprocalTradeOffer) {
                            $reciprocalTradeOffer->update(['status' => 'accepted']);
                        }
                    }
                }
            }
        });

        \Log::info('Swipe created/updated', [
            'swipe_id' => $swipe->id,
            'from_user_id' => $swipe->from_user_id,
            'target_item_id' => $swipe->target_item_id,
            'offered_item_id' => $swipe->offered_item_id,
            'direction' => $swipe->direction,
            'match_created' => $matchCreated,
        ]);

        return response()->json([
            'swipe' => $swipe,
            'match' => $match,
            'match_created' => $matchCreated,
            'match_id' => $match?->id,
            'conversation_id' => $match?->conversation_id,
        ]);
    }

    public function pendingRequests(Request $request)
    {
        // This method is deprecated in favor of TradeOfferController@pending
        // Keeping for backward compatibility but should redirect to new endpoint
        $user = $request->user();
        
        return response()->json([
            'requests' => [],
            'message' => 'This endpoint is deprecated. Use GET /trade-offers/pending instead.',
        ]);
    }
}
