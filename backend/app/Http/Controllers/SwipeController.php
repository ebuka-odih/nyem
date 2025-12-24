<?php

namespace App\Http\Controllers;

use App\Events\ConversationCreated;
use App\Events\MatchCreated;
use App\Models\Item;
use App\Models\ItemStat;
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
            'offered_item_id' => 'nullable|exists:items,id',
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

        // Determine item type - default to 'barter' if not set
        $itemType = $targetItem->type ?? 'barter';

        // For right swipes, validate based on item type
        if ($data['direction'] === 'right') {
            if ($itemType === 'barter') {
                // Barter items require an offered_item_id
                if (empty($data['offered_item_id'])) {
                    return response()->json(['message' => 'offered_item_id is required for barter items'], 422);
                }

                $offeredItem = Item::findOrFail($data['offered_item_id']);
                if ($offeredItem->user_id !== $user->id) {
                    return response()->json(['message' => 'offered_item_id must belong to you'], 422);
                }

                if ($offeredItem->id === $targetItem->id) {
                    return response()->json(['message' => 'Cannot offer the same item you are swiping on'], 422);
                }
            } else {
                // Marketplace items: offered_item_id is optional (just indicates interest)
                // If provided, validate it belongs to user, but don't require it
                if (!empty($data['offered_item_id'])) {
                    $offeredItem = Item::findOrFail($data['offered_item_id']);
                    if ($offeredItem->user_id !== $user->id) {
                        return response()->json(['message' => 'offered_item_id must belong to you'], 422);
                    }
                }
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

            // Determine item type
            $itemType = $targetItem->type ?? 'barter';
            
            // Create or update swipe
            $swipe = Swipe::updateOrCreate(
                [
                    'from_user_id' => $user->id,
                    'target_item_id' => $targetItem->id,
                ],
                [
                    'direction' => $data['direction'],
                    'offered_item_id' => ($data['direction'] === 'right' && $itemType === 'barter') ? $data['offered_item_id'] : null,
                ]
            );

            // Track like in ItemStat when swiping right
            if ($data['direction'] === 'right') {
                // Check if like already exists for this swipe
                $existingLike = ItemStat::where('item_id', $targetItem->id)
                    ->where('type', 'like')
                    ->where('user_id', $user->id)
                    ->where('swipe_id', $swipe->id)
                    ->first();

                if (!$existingLike) {
                    ItemStat::create([
                        'item_id' => $targetItem->id,
                        'user_id' => $user->id,
                        'type' => 'like',
                        'swipe_id' => $swipe->id,
                    ]);
                }
            } else {
                // Remove like stat when swiping left (if it exists)
                ItemStat::where('item_id', $targetItem->id)
                    ->where('type', 'like')
                    ->where('user_id', $user->id)
                    ->where('swipe_id', $swipe->id)
                    ->delete();
            }

            if ($data['direction'] === 'right') {
                if ($itemType === 'barter') {
                    // Barter items: create trade offer (requires offered_item_id)
                    if (!empty($data['offered_item_id'])) {
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
                    } else {
                        $reciprocal = null;
                    }
                } else {
                    // Marketplace items: just record interest, no trade offer needed
                    // Conversations/matches can be created separately when users chat
                    $reciprocal = null;
                }

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

                    $conversationCreated = $conversation->wasRecentlyCreated;

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

                        // Broadcast events after transaction commits
                        // We'll do this outside the transaction to ensure data is persisted
                        DB::afterCommit(function () use ($match, $conversation, $conversationCreated) {
                            // Broadcast match created event to both users
                            broadcast(new MatchCreated($match));

                            // CUSTOM WEBSOCKET BROADCAST - Match Created
                            try {
                                $matchEvent = new MatchCreated($match);
                                \Illuminate\Support\Facades\Http::timeout(2)->post('http://127.0.0.1:6001/broadcast', [
                                    'type' => 'match.created',
                                    'receivers' => [$match->user1_id, $match->user2_id],
                                    'data' => $matchEvent->broadcastWith()
                                ]);
                            } catch (\Exception $e) {
                                \Illuminate\Support\Facades\Log::error('Custom WebSocket broadcast (match) failed: ' . $e->getMessage());
                            }

                            // Broadcast conversation created event if it's a new conversation
                            if ($conversationCreated) {
                                broadcast(new ConversationCreated($conversation));

                                // CUSTOM WEBSOCKET BROADCAST - Conversation Created
                                try {
                                    $convEvent = new ConversationCreated($conversation);
                                    \Illuminate\Support\Facades\Http::timeout(2)->post('http://127.0.0.1:6001/broadcast', [
                                        'type' => 'conversation.created',
                                        'receivers' => [$conversation->user1_id, $conversation->user2_id],
                                        'data' => $convEvent->broadcastWith()
                                    ]);
                                } catch (\Exception $e) {
                                    \Illuminate\Support\Facades\Log::error('Custom WebSocket broadcast (conversation) failed: ' . $e->getMessage());
                                }
                            }
                        });
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
