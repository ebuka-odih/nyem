<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Report;
use App\Models\UserMatch;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function report(Request $request)
    {
        $data = $request->validate([
            'target_user_id' => 'nullable|exists:users,id',
            'target_item_id' => 'nullable|exists:items,id',
            'reason' => 'nullable|string|max:500',
        ]);

        if (empty($data['target_user_id']) && empty($data['target_item_id'])) {
            return response()->json(['message' => 'Provide a user or item to report'], 422);
        }

        $report = Report::create([
            'reporter_id' => $request->user()->id,
            'target_user_id' => $data['target_user_id'] ?? null,
            'target_item_id' => $data['target_item_id'] ?? null,
            'reason' => $data['reason'] ?? null,
        ]);

        return response()->json(['report' => $report], 201);
    }

    public function block(Request $request)
    {
        $data = $request->validate([
            'blocked_user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        if ($data['blocked_user_id'] === $user->id) {
            return response()->json(['message' => 'Cannot block yourself'], 422);
        }

        $block = Block::firstOrCreate(
            [
                'blocker_id' => $user->id,
                'blocked_user_id' => $data['blocked_user_id'],
            ],
            ['reason' => $data['reason'] ?? null]
        );

        return response()->json(['block' => $block], 201);
    }
}
