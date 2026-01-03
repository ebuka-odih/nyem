<?php

namespace App\Http\Controllers;

use App\Events\ConversationCreated;
use App\Events\MessageSent;
use App\Models\UserConversation;
use App\Models\Message;
use App\Models\MessageRequest;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ConversationController extends Controller
{
    /**
     * Start a new conversation with a user and optionally send a first message.
     * For marketplace items: creates a message request that seller must approve.
     * For barter items or if no item_id: creates conversation directly (backward compatibility).
     * If a conversation already exists between the users, returns that conversation.
     */
    public function start(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => 'required|uuid|exists:users,id',
            'message_text' => 'nullable|string|max:1000',
            'listing_id' => 'nullable|uuid|exists:listings,id', // Optional: the listing context
            'item_id' => 'nullable|uuid|exists:listings,id', // Backward compatibility alias
        ]);

        $user = $request->user();
        $recipientId = $data['recipient_id'];

        // Prevent self-conversation
        if ($user->id === $recipientId) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot start a conversation with yourself',
            ], 422);
        }

        // Check if blocked
        if ($this->isBlockedBetween($user, $recipientId)) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to start conversation with this user',
            ], 403);
        }

        // If listing_id is provided, check if it's a marketplace listing
        // For marketplace listings, create a message request instead of immediate conversation
        $listingId = $data['listing_id'] ?? $data['item_id'] ?? null;
        if (!empty($listingId)) {
            $listing = Listing::findOrFail($listingId);
            $listingType = $listing->type ?? Listing::TYPE_BARTER;
            
            // Verify the recipient is the listing owner
            if ($listing->user_id !== $recipientId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Listing does not belong to the specified recipient',
                ], 422);
            }

            // For marketplace listings, create a message request
            if ($listingType === Listing::TYPE_MARKETPLACE) {
                // Check if message text is provided (required for marketplace requests)
                if (empty($data['message_text']) || trim($data['message_text']) === '') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Message text is required for marketplace listings',
                    ], 422);
                }

                // Check if a conversation already exists between these users
                $userIds = [$user->id, $recipientId];
                sort($userIds);
                $existingConversation = UserConversation::where('user1_id', $userIds[0])
                    ->where('user2_id', $userIds[1])
                    ->first();

                // If conversation exists, allow direct messaging (no request needed)
                if ($existingConversation) {
                    return $this->createDirectMessage($user, $recipientId, $existingConversation, $data['message_text']);
                }

                // Create or update message request (allow updating if request already exists)
                $messageText = trim($data['message_text']);
                $messageText = mb_convert_encoding($messageText, 'UTF-8', 'UTF-8');

                $messageRequest = MessageRequest::updateOrCreate(
                    [
                        'from_user_id' => $user->id,
                        'to_user_id' => $recipientId,
                        'listing_id' => $listing->id,
                    ],
                    [
                        'message_text' => $messageText,
                        'status' => 'pending',
                    ]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Message request sent successfully. The seller will need to approve it.',
                    'data' => [
                        'message_request' => [
                            'id' => $messageRequest->id,
                            'status' => $messageRequest->status,
                            'created_at' => $messageRequest->created_at,
                        ],
                        'requires_approval' => true,
                    ],
                ], 201);
            }
        }

        // For barter listings or when no listing_id is provided, create conversation directly (backward compatibility)
        // Get or create conversation (user IDs must be sorted for consistency)
        $userIds = [$user->id, $recipientId];
        sort($userIds);

        $conversationCreated = false;
        $message = null;

        $result = DB::transaction(function () use ($userIds, $user, $recipientId, $data, &$conversationCreated) {
            // Get or create conversation
            $conversation = UserConversation::firstOrCreate(
                [
                    'user1_id' => $userIds[0],
                    'user2_id' => $userIds[1],
                ]
            );

            $conversationCreated = $conversation->wasRecentlyCreated;

            // Send first message if provided
            $message = null;
            if (!empty($data['message_text'])) {
                $messageText = trim($data['message_text']);
                
                // Ensure proper UTF-8 encoding
                $messageText = mb_convert_encoding($messageText, 'UTF-8', 'UTF-8');

                $message = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'receiver_id' => $recipientId,
                    'message_text' => $messageText,
                ]);

                // Update conversation's updated_at timestamp
                $conversation->touch();
            }

            return [
                'conversation' => $conversation,
                'message' => $message,
            ];
        });

        $conversation = $result['conversation'];
        $message = $result['message'];

        // Get other user details
        $otherUser = User::find($recipientId);

        // Broadcast events
        if ($conversationCreated) {
            broadcast(new ConversationCreated($conversation));

            // CUSTOM WEBSOCKET BROADCAST - Conversation Created
            try {
                $convEvent = new ConversationCreated($conversation);
                Http::timeout(2)->post('http://127.0.0.1:6001/broadcast', [
                    'type' => 'conversation.created',
                    'receivers' => [$conversation->user1_id, $conversation->user2_id],
                    'data' => $convEvent->broadcastWith()
                ]);
            } catch (\Exception $e) {
                Log::error('Custom WebSocket broadcast (conversation) failed: ' . $e->getMessage());
            }
        }

        if ($message) {
            broadcast(new MessageSent($message));

            // CUSTOM WEBSOCKET BROADCAST - Message Sent
            try {
                Http::timeout(2)->post('http://127.0.0.1:6001/broadcast', [
                    'type' => 'message.sent',
                    'receivers' => [$recipientId, $user->id],
                    'data' => [
                        'message' => $message->load(['sender', 'receiver']),
                        'conversation_id' => $conversation->id
                    ]
                ]);
            } catch (\Exception $e) {
                Log::error('Custom WebSocket broadcast (message) failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => $conversationCreated ? 'Conversation started successfully' : 'Conversation found',
            'data' => [
                'conversation' => [
                    'id' => $conversation->id,
                    'conversation_id' => $conversation->id,
                    'other_user' => $otherUser,
                    'created_at' => $conversation->created_at,
                    'updated_at' => $conversation->updated_at,
                ],
                'first_message' => $message ? $message->load(['sender', 'receiver']) : null,
                'conversation_created' => $conversationCreated,
                'requires_approval' => false,
            ],
        ], $conversationCreated ? 201 : 200);
    }

    /**
     * Helper method to create a direct message in an existing conversation
     */
    private function createDirectMessage(User $user, string $recipientId, UserConversation $conversation, string $messageText)
    {
        $messageText = trim($messageText);
        $messageText = mb_convert_encoding($messageText, 'UTF-8', 'UTF-8');

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'receiver_id' => $recipientId,
            'message_text' => $messageText,
        ]);

        // Update conversation's updated_at timestamp
        $conversation->touch();

        // Get other user details
        $otherUser = User::find($recipientId);

        // Broadcast message sent event
        broadcast(new MessageSent($message));

        // CUSTOM WEBSOCKET BROADCAST - Message Sent
        try {
            Http::timeout(2)->post('http://127.0.0.1:6001/broadcast', [
                'type' => 'message.sent',
                'receivers' => [$recipientId, $user->id],
                'data' => [
                    'message' => $message->load(['sender', 'receiver']),
                    'conversation_id' => $conversation->id
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Custom WebSocket broadcast (message) failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data' => [
                'conversation' => [
                    'id' => $conversation->id,
                    'conversation_id' => $conversation->id,
                    'other_user' => $otherUser,
                    'created_at' => $conversation->created_at,
                    'updated_at' => $conversation->updated_at,
                ],
                'first_message' => $message->load(['sender', 'receiver']),
                'conversation_created' => false,
                'requires_approval' => false,
            ],
        ], 200);
    }

    /**
     * List all conversations for authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $conversations = UserConversation::with(['user1', 'user2'])
            ->forUser($user->id)
            ->with(['messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->latest('updated_at')
            ->get()
            ->map(function ($conversation) use ($user) {
                $otherUser = $conversation->user1_id === $user->id 
                    ? $conversation->user2 
                    : $conversation->user1;
                
                $lastMessage = $conversation->messages->first();
                
                return [
                    'id' => $conversation->id,
                    'conversation_id' => $conversation->id,
                    'other_user' => $otherUser,
                    'last_message' => $lastMessage ? [
                        'id' => $lastMessage->id,
                        'message_text' => $lastMessage->message_text,
                        'sender_id' => $lastMessage->sender_id,
                        'created_at' => $lastMessage->created_at,
                    ] : null,
                    'created_at' => $conversation->created_at,
                    'updated_at' => $conversation->updated_at,
                ];
            });

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * Fetch chat messages for a conversation
     */
    public function messages(Request $request, UserConversation $conversation)
    {
        $user = $request->user();
        
        if (!in_array($user->id, [$conversation->user1_id, $conversation->user2_id], true)) {
            return response()->json(['message' => 'Not authorized for this conversation'], 403);
        }

        $otherUserId = $conversation->otherUserId($user->id);
        if ($otherUserId && $this->isBlockedBetween($user, $otherUserId)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $messages = Message::where('conversation_id', $conversation->id)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['messages' => $messages]);
    }

    /**
     * Fetch all item matches between the two users in a conversation
     */
    public function matches(Request $request, UserConversation $conversation)
    {
        $user = $request->user();
        
        if (!in_array($user->id, [$conversation->user1_id, $conversation->user2_id], true)) {
            return response()->json(['message' => 'Not authorized for this conversation'], 403);
        }

        $otherUserId = $conversation->otherUserId($user->id);
        if ($otherUserId && $this->isBlockedBetween($user, $otherUserId)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $matches = $conversation->matches()
            ->with(['listing1', 'listing2'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($match) use ($user) {
                // Determine which listing belongs to which user
                $myListing = $match->listing1->user_id === $user->id ? $match->listing1 : $match->listing2;
                $theirListing = $match->listing1->user_id === $user->id ? $match->listing2 : $match->listing1;
                
                return [
                    'id' => $match->id,
                    'listing1_title' => $match->listing1->title,
                    'listing2_title' => $match->listing2->title,
                    'my_listing' => $myListing,
                    'their_listing' => $theirListing,
                    'item1_title' => $match->listing1->title, // Backward compatibility
                    'item2_title' => $match->listing2->title, // Backward compatibility
                    'my_item' => $myListing, // Backward compatibility
                    'their_item' => $theirListing, // Backward compatibility
                    'created_at' => $match->created_at,
                ];
            });

        return response()->json(['matches' => $matches]);
    }
}

