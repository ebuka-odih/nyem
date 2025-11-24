<?php

namespace App\Http\Controllers;

use App\Events\ConversationCreated;
use App\Events\MatchCreated;
use App\Models\TradeOffer;
use App\Models\Swipe;
use App\Models\UserMatch;
use App\Models\UserConversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TradeOfferController extends Controller
{
    public function pending(Request $request)
    {
        $user = $request->user();

        // Get all pending trade offers where current user is the recipient
        $offers = TradeOffer::where('to_user_id', $user->id)
            ->where('status', 'pending')
            ->with(['fromUser', 'targetItem', 'offeredItem'])
            ->latest()
            ->get();

        // Filter out offers from blocked users
        $blockedUserIds = $this->blockedUserIds($user);

        $filteredOffers = $offers->filter(function ($offer) use ($blockedUserIds) {
            return !in_array($offer->from_user_id, $blockedUserIds);
        })->map(function ($offer) {
            return [
                'id' => $offer->id,
                'from_user' => [
                    'id' => $offer->fromUser->id,
                    'username' => $offer->fromUser->username,
                    'photo' => $offer->fromUser->profile_photo ?? null,
                    'city' => $offer->fromUser->city,
                ],
                'target_item' => [
                    'id' => $offer->targetItem->id,
                    'title' => $offer->targetItem->title,
                    'photo' => !empty($offer->targetItem->photos) ? $offer->targetItem->photos[0] : null,
                ],
                'offered_item' => [
                    'id' => $offer->offeredItem->id,
                    'title' => $offer->offeredItem->title,
                    'photo' => !empty($offer->offeredItem->photos) ? $offer->offeredItem->photos[0] : null,
                ],
                'status' => $offer->status,
                'created_at' => $offer->created_at,
            ];
        })->values();

        return response()->json([
            'offers' => $filteredOffers,
        ]);
    }

    public function respond(Request $request, string $id)
    {
        $data = $request->validate([
            'decision' => 'required|in:accept,decline',
        ]);

        $user = $request->user();
        $offer = TradeOffer::with(['fromUser', 'targetItem', 'offeredItem'])->findOrFail($id);

        // Verify the offer is for the current user
        if ($offer->to_user_id !== $user->id) {
            return response()->json(['message' => 'Not authorized for this offer'], 403);
        }

        // Verify offer is still pending
        if ($offer->status !== 'pending') {
            return response()->json(['message' => 'Offer is no longer pending'], 422);
        }

        // Check if users are blocked
        if ($this->isBlockedBetween($user, $offer->from_user_id)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $match = null;
        $matchCreated = false;

        DB::transaction(function () use ($user, $offer, $data, &$match, &$matchCreated) {
            if ($data['decision'] === 'accept') {
                // Create swipe record where User B (current user) swipes right on User A's offered item
                // User B is offering their target_item for User A's offered_item
                $swipe = Swipe::updateOrCreate(
                    [
                        'from_user_id' => $user->id,
                        'target_item_id' => $offer->offered_item_id, // User B swipes on User A's offered item
                    ],
                    [
                        'direction' => 'right',
                        'offered_item_id' => $offer->target_item_id, // User B offers their target item
                    ]
                );

                // Check if reciprocal swipe already exists (from the original swipe)
                // User A already swiped right on User B's target_item, offering User A's offered_item
                $reciprocal = Swipe::where('from_user_id', $offer->from_user_id)
                    ->where('target_item_id', $offer->target_item_id) // User A swiped on User B's target item
                    ->where('offered_item_id', $offer->offered_item_id) // User A offered their item
                    ->where('direction', 'right')
                    ->first();

                if ($reciprocal) {
                    // Create match
                    $userIds = [$user->id, $offer->from_user_id];
                    sort($userIds);
                    $firstUserId = $userIds[0];
                    $secondUserId = $userIds[1];

                    // Determine item IDs based on user order
                    $firstItemId = $firstUserId === $user->id ? $offer->target_item_id : $offer->offered_item_id;
                    $secondItemId = $firstUserId === $user->id ? $offer->offered_item_id : $offer->target_item_id;

                    // Get or create conversation (user IDs are already sorted)
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

                    // Update trade offer status
                    $offer->update(['status' => 'accepted']);

                    // Broadcast events after transaction commits
                    if ($matchCreated) {
                        DB::afterCommit(function () use ($match, $conversation, $conversationCreated) {
                            // Broadcast match created event to both users
                            broadcast(new MatchCreated($match));

                            // Broadcast conversation created event if it's a new conversation
                            if ($conversationCreated) {
                                broadcast(new ConversationCreated($conversation));
                            }
                        });
                    }
                } else {
                    // This shouldn't happen if the flow is correct, but handle it gracefully
                    $offer->update(['status' => 'accepted']);
                }
            } else {
                // Decline
                $offer->update(['status' => 'declined']);
            }
        });

        return response()->json([
            'offer' => $offer->fresh(),
            'match' => $match,
            'match_created' => $matchCreated,
            'match_id' => $match?->id,
        ]);
    }
}
