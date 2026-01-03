<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
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

        // Validate that message doesn't contain image data (base64 images)
        // Allow emojis and regular text, but block image data URIs
        $messageText = $data['message_text'];
        
        // Check for base64 image data URIs (data:image/...;base64,...)
        // This is the most common way images are embedded in text
        if (preg_match('/data:image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml|svg);base64/i', $messageText)) {
            return response()->json([
                'message' => 'Images are not allowed in messages. Please send text only.',
            ], 422);
        }

        // Check for very long base64 strings that might be image data
        // Base64 image data is typically very long (1000+ characters)
        // We use a conservative threshold to avoid false positives
        if (preg_match('/[A-Za-z0-9+\/]{2000,}={0,2}/', $messageText)) {
            return response()->json([
                'message' => 'Images are not allowed in messages. Please send text only.',
            ], 422);
        }

        $conversation = UserConversation::findOrFail($data['conversation_id']);
        $user = $request->user();

        if (! in_array($user->id, [$conversation->user1_id, $conversation->user2_id], true)) {
            return response()->json(['message' => 'Not authorized for this conversation'], 403);
        }

        $receiverId = $conversation->otherUserId($user->id);

        if (! $receiverId || $this->isBlockedBetween($user, $receiverId)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        // Ensure proper UTF-8 encoding
        $messageText = mb_convert_encoding($messageText, 'UTF-8', 'UTF-8');

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'message_text' => $messageText,
        ]);

        // Update conversation's updated_at timestamp
        $conversation->touch();

        // Broadcast message sent event
        // Note: We broadcast to both users so both can see the message in real-time
        // The frontend will handle displaying it appropriately
        broadcast(new MessageSent($message));

        // CUSTOM WEBSOCKET BROADCAST
        try {
            \Illuminate\Support\Facades\Http::timeout(2)->post('http://127.0.0.1:6001/broadcast', [
                'type' => 'message.sent',
                'receivers' => [$receiverId, $user->id],
                'data' => [
                    'message' => $message->load(['sender', 'receiver']),
                    'conversation_id' => $conversation->id
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Custom WebSocket broadcast failed: ' . $e->getMessage());
        }

        return response()->json(['message' => $message->load(['sender', 'receiver'])], 201);
    }
}
