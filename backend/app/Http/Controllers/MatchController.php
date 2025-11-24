<?php

namespace App\Http\Controllers;

use App\Models\UserMatch;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $matches = UserMatch::with(['item1', 'item2', 'user1', 'user2'])
            ->forUser($user->id)
            ->latest()
            ->get();

        return response()->json(['matches' => $matches]);
    }

    public function show(Request $request, UserMatch $match)
    {
        $user = $request->user();
        if (! in_array($user->id, [$match->user1_id, $match->user2_id], true)) {
            return response()->json(['message' => 'Not authorized for this match'], 403);
        }

        $otherUserId = $match->otherUserId($user->id);
        if ($otherUserId && $this->isBlockedBetween($user, $otherUserId)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        return response()->json([
            'match' => $match->load(['item1', 'item2', 'user1', 'user2', 'conversation']),
        ]);
    }
}
