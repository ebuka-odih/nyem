<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\UserConversation;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'conversation_id' => 'required|exists:user_conversations,id',
            'message_text' => 'required|string|max:1000',
        ]);

        $conversation = UserConversation::findOrFail($data['conversation_id']);
        $user = $request->user();

        if (! in_array($user->id, [$conversation->user1_id, $conversation->user2_id], true)) {
            return response()->json(['message' => 'Not authorized for this conversation'], 403);
        }

        $receiverId = $conversation->otherUserId($user->id);

        if (! $receiverId || $this->isBlockedBetween($user, $receiverId)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'message_text' => $data['message_text'],
        ]);

        // Update conversation's updated_at timestamp
        $conversation->touch();

        return response()->json(['message' => $message->load(['sender', 'receiver'])], 201);
    }
}
