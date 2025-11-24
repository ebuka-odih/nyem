<?php

namespace App\Http\Controllers;

use App\Models\UserConversation;
use App\Models\Message;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
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

