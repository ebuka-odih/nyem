<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\UserMatch;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request, UserMatch $match)
    {
        $user = $request->user();
        if (! in_array($user->id, [$match->user1_id, $match->user2_id], true)) {
            return response()->json(['message' => 'Not authorized for this match'], 403);
        }

        $otherUserId = $match->otherUserId($user->id);
        if ($otherUserId && $this->isBlockedBetween($user, $otherUserId)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $messages = $match->messages()
            ->with(['sender', 'receiver'])
            ->latest()
            ->get();

        return response()->json(['messages' => $messages]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'match_id' => 'required|exists:user_matches,id',
            'message_text' => 'required|string|max:1000',
        ]);

        $match = UserMatch::findOrFail($data['match_id']);
        $user = $request->user();

        if (! in_array($user->id, [$match->user1_id, $match->user2_id], true)) {
            return response()->json(['message' => 'Not authorized for this match'], 403);
        }

        $receiverId = $match->otherUserId($user->id);

        if (! $receiverId || $this->isBlockedBetween($user, $receiverId)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $message = Message::create([
            'match_id' => $match->id,
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'message_text' => $data['message_text'],
        ]);

        return response()->json(['message' => $message], 201);
    }
}
