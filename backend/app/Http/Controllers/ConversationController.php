<?php

namespace App\Http\Controllers;

use App\Events\ConversationCreated;
use App\Events\MessageSent;
use App\Models\UserConversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ConversationController extends Controller
{
    /**
     * Start a new conversation with a user and optionally send a first message.
     * If a conversation already exists between the users, returns that conversation.
     */
    public function start(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => 'required|uuid|exists:users,id',
            'message_text' => 'nullable|string|max:1000',
            'item_id' => 'nullable|uuid|exists:items,id', // Optional: the item context
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
            ],
        ], $conversationCreated ? 201 : 200);
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
            ->with(['item1', 'item2'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($match) use ($user) {
                // Determine which item belongs to which user
                $myItem = $match->item1->user_id === $user->id ? $match->item1 : $match->item2;
                $theirItem = $match->item1->user_id === $user->id ? $match->item2 : $match->item1;
                
                return [
                    'id' => $match->id,
                    'item1_title' => $match->item1->title,
                    'item2_title' => $match->item2->title,
                    'my_item' => $myItem,
                    'their_item' => $theirItem,
                    'created_at' => $match->created_at,
                ];
            });

        return response()->json(['matches' => $matches]);
    }
}

