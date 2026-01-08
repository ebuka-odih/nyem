<?php

namespace App\Http\Controllers;

use App\Events\ConversationCreated;
use App\Events\MatchCreated;
use App\Models\Listing;
use App\Models\ListingStat;
use App\Models\Swipe;
use App\Models\TradeOffer;
use App\Models\UserMatch;
use App\Models\UserConversation;
use App\Models\MessageRequest;
use App\Mail\ItemStarredEmail;
use App\Services\OneSignalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SwipeController extends Controller
{
    public function store(Request $request)
    {
        $listingTable = (new Listing())->getTable();
        
        // Manual validation for better error messages and logging
        $validator = \Validator::make($request->all(), [
            'target_listing_id' => 'required',
            'target_item_id' => 'sometimes',
            'direction' => 'required|in:left,right,up',
            'offered_listing_id' => 'nullable',
            'offered_item_id' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $targetListingId = $data['target_listing_id'] ?? $data['target_item_id'] ?? $request->input('target_listing_id');
        $offeredListingId = $data['offered_listing_id'] ?? $data['offered_item_id'] ?? $request->input('offered_listing_id');

        // Check if listing exists in either items or listings table
        $targetListing = Listing::with('user')->find($targetListingId);
        
        if (!$targetListing) {
            // Fallback: search explicitly by ID in both tables if model find failed
            $existsInItems = \DB::table('items')->where('id', $targetListingId)->exists();
            $existsInListings = \DB::table('listings')->where('id', $targetListingId)->exists();
            
            \Log::error('Swipe Failed: Listing not found', [
                'id_attempted' => $targetListingId,
                'exists_in_items' => $existsInItems,
                'exists_in_listings' => $existsInListings,
                'listing_table_prop' => $listingTable,
                'payload' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'The selected target listing id is invalid.',
                'errors' => ['target_listing_id' => ["The selected target listing id [{$targetListingId}] is invalid."]]
            ], 422);
        }

        $user = $request->user();

        if (!$targetListing->user_id || !$targetListing->user) {
            return response()->json(['message' => 'Listing owner not found'], 404);
        }

        if ($targetListing->user_id === $user->id) {
            return response()->json(['message' => 'Cannot swipe on your own listing'], 422);
        }

        if ($this->isBlockedBetween($user, $targetListing->user_id)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        // Determine listing type - default to 'barter' if not set
        $listingType = $targetListing->type ?? Listing::TYPE_BARTER;

        // For right swipes, validate based on listing type
        if ($data['direction'] === 'right') {
            if ($listingType === Listing::TYPE_BARTER) {
                // Barter listings require an offered_listing_id
                if (empty($offeredListingId)) {
                    return response()->json(['message' => 'offered_listing_id is required for barter listings'], 422);
                }

                $offeredListing = Listing::findOrFail($offeredListingId);
                if ($offeredListing->user_id !== $user->id) {
                    return response()->json(['message' => 'offered_listing_id must belong to you'], 422);
                }

                if ($offeredListing->id === $targetListing->id) {
                    return response()->json(['message' => 'Cannot offer the same listing you are swiping on'], 422);
                }
            } else {
                // Marketplace listings: offered_listing_id is optional (just indicates interest)
                // If provided, validate it belongs to user, but don't require it
                if (!empty($offeredListingId)) {
                    $offeredListing = Listing::findOrFail($offeredListingId);
                    if ($offeredListing->user_id !== $user->id) {
                        return response()->json(['message' => 'offered_listing_id must belong to you'], 422);
                    }
                }
            }
        }

        \Log::info('Creating swipe', [
            'from_user_id' => $user->id,
            'target_listing_id' => $targetListing->id,
            'offered_listing_id' => $offeredListingId,
            'listing_owner_id' => $targetListing->user_id,
            'direction' => $data['direction'],
        ]);

        $match = null;
        $matchCreated = false;
        $tradeOffer = null;

        DB::transaction(function () use ($user, $targetListing, $offeredListingId, $listingType, $data, &$swipe, &$match, &$matchCreated, &$tradeOffer) {
            // Check if there's an existing swipe (to handle direction changes)
            $existingSwipe = Swipe::where('from_user_id', $user->id)
                ->where('target_listing_id', $targetListing->id)
                ->first();

            // If changing from right to left, decline any pending trade offers
            if ($existingSwipe && $existingSwipe->direction === 'right' && $data['direction'] === 'left') {
                TradeOffer::where('from_user_id', $user->id)
                    ->where('target_listing_id', $targetListing->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'declined']);
            }
            
            // Create or update swipe
            $swipe = Swipe::updateOrCreate(
                [
                    'from_user_id' => $user->id,
                    'target_listing_id' => $targetListing->id,
                ],
                [
                    'direction' => $data['direction'],
                    'offered_listing_id' => ($data['direction'] === 'right' && $listingType === Listing::TYPE_BARTER) ? $offeredListingId : null,
                ]
            );

            // Track like in ListingStat when swiping right or up (star)
            if ($data['direction'] === 'right' || $data['direction'] === 'up') {
                // Check if like already exists for this swipe
                $existingLike = ListingStat::where('listing_id', $targetListing->id)
                    ->where('type', $data['direction'] === 'up' ? 'star' : 'like')
                    ->where('user_id', $user->id)
                    ->where('swipe_id', $swipe->id)
                    ->first();

                if (!$existingLike) {
                    ListingStat::create([
                        'listing_id' => $targetListing->id,
                        'user_id' => $user->id,
                        'type' => $data['direction'] === 'up' ? 'star' : 'like',
                        'swipe_id' => $swipe->id,
                    ]);
                }
            } else {
                // Remove like stat when swiping left (if it exists)
                ListingStat::where('listing_id', $targetListing->id)
                    ->where('type', 'like')
                    ->where('user_id', $user->id)
                    ->where('swipe_id', $swipe->id)
                    ->delete();
            }

            // Handle 'up' direction (star action) - send notification to seller and create message request
            if ($data['direction'] === 'up') {
                // Create a message request so it appears in the Match screen "Requests" tab
                MessageRequest::firstOrCreate(
                    [
                        'from_user_id' => $user->id,
                        'to_user_id' => $targetListing->user_id,
                        'listing_id' => $targetListing->id,
                    ],
                    [
                        'message_text' => 'Interested in your item!',
                        'status' => 'pending',
                    ]
                );

                // Send OneSignal push notification and Email to seller
                DB::afterCommit(function () use ($targetListing, $user) {
                    try {
                        $seller = $targetListing->user;
                        if ($seller) {
                            // 1. Send Push Notification to Seller
                            $oneSignalService = new OneSignalService();
                            $oneSignalService->sendStarNotification($seller, $targetListing, $user);

                            // 2. Send Confirmation Push to Buyer
                            $oneSignalService->sendStarConfirmation($user, $targetListing);

                            // 3. Send Email Notification
                            if ($seller->email) {
                                Mail::to($seller->email)->send(new ItemStarredEmail($seller, $targetListing, $user));
                            }
                        }
                    } catch (\Exception $e) {
                        \Log::error('Failed to send star notifications: ' . $e->getMessage());
                    }
                });
            }

            if ($data['direction'] === 'right') {
                if ($listingType === Listing::TYPE_BARTER) {
                    // Barter listings: create trade offer (requires offered_listing_id)
                    if (!empty($offeredListingId)) {
                        $tradeOffer = TradeOffer::firstOrCreate(
                            [
                                'from_user_id' => $user->id,
                                'to_user_id' => $targetListing->user_id,
                                'offered_listing_id' => $offeredListingId,
                                'target_listing_id' => $targetListing->id,
                            ],
                            [
                                'status' => 'pending',
                            ]
                        );

                        // Check for reciprocal swipe
                        // User B must have swiped right on User A's offered_listing
                        // AND User B's offered_listing must be User A's target_listing
                        $reciprocal = Swipe::where('from_user_id', $targetListing->user_id)
                            ->where('target_listing_id', $offeredListingId) // User B swiped on User A's offered listing
                            ->where('offered_listing_id', $targetListing->id) // User B offered User A's target listing
                            ->where('direction', 'right')
                            ->first();
                    } else {
                        $reciprocal = null;
                    }
                } else {
                    // Marketplace listings: just record interest, no trade offer needed
                    // Conversations/matches can be created separately when users chat
                    $reciprocal = null;
                }

                if ($reciprocal) {
                    // Create match
                    $userIds = [$user->id, $targetListing->user_id];
                    sort($userIds);
                    $firstUserId = $userIds[0];
                    $secondUserId = $userIds[1];

                    // Determine listing IDs based on user order
                    $firstListingId = $firstUserId === $user->id ? $offeredListingId : $targetListing->id;
                    $secondListingId = $firstUserId === $user->id ? $targetListing->id : $offeredListingId;

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
                            'listing1_id' => $firstListingId,
                            'listing2_id' => $secondListingId,
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
                        $reciprocalTradeOffer = TradeOffer::where('from_user_id', $targetListing->user_id)
                            ->where('to_user_id', $user->id)
                            ->where('offered_listing_id', $targetListing->id)
                            ->where('target_listing_id', $offeredListingId)
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
            'target_listing_id' => $swipe->target_listing_id,
            'offered_listing_id' => $swipe->offered_listing_id,
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

    /**
     * Get user's wishlist items (swipes with direction='up')
     * Only returns items that are still within 24 hours
     */
    public function wishlist(Request $request)
    {
        $user = $request->user();
        
        // Get all 'up' swipes (star/wishlist items) that are less than 24 hours old
        $twentyFourHoursAgo = now()->subHours(24);
        
        $wishlistSwipes = Swipe::where('from_user_id', $user->id)
            ->where('direction', 'up')
            ->where('created_at', '>=', $twentyFourHoursAgo)
            ->with(['targetListing' => function ($query) {
                $query->with(['user', 'category']);
            }])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Transform swipes to listing format
        $wishlistItems = $wishlistSwipes->map(function ($swipe) {
            $listing = $swipe->targetListing;
            if (!$listing) {
                return null;
            }
            
            // Get photos array - handle both array and accessor
            $photos = $listing->photos;
            if (is_string($photos)) {
                $photos = json_decode($photos, true) ?? [];
            }
            if (!is_array($photos)) {
                $photos = [];
            }
            
            return [
                'id' => $listing->id,
                'name' => $listing->title,
                'description' => $listing->description,
                'price' => $listing->price,
                'category' => $listing->category->name ?? 'Uncategorized',
                'images' => $photos,
                'image' => !empty($photos) ? $photos[0] : null,
                'isSuper' => true,
                'swipe_id' => $swipe->id,
                'swipe_created_at' => $swipe->created_at,
                'owner' => $listing->user ? [
                    'id' => $listing->user->id,
                    'name' => $listing->user->name ?? $listing->user->username,
                    'username' => $listing->user->username,
                    'image' => $listing->user->profile_photo,
                ] : null,
            ];
        })->filter()->values();
        
        return response()->json([
            'success' => true,
            'data' => [
                'items' => $wishlistItems,
                'count' => $wishlistItems->count(),
            ],
        ]);
    }
}
