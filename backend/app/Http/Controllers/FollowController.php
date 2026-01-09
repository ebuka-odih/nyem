<?php

namespace App\Http\Controllers;

use App\Models\Follower;
use App\Models\User;
use App\Services\OneSignalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FollowController extends Controller
{
    protected $oneSignalService;

    public function __construct(OneSignalService $oneSignalService)
    {
        $this->oneSignalService = $oneSignalService;
    }

    /**
     * Follow a user
     */
    public function follow(Request $request, User $user)
    {
        $follower = $request->user();
        $following = $user;

        if ($follower->id === $following->id) {
            return response()->json(['message' => 'You cannot follow yourself'], 422);
        }

        $follow = Follower::firstOrCreate([
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);

        if ($follow->wasRecentlyCreated) {
            // Send push notification confirmation to the follower
            try {
                $this->oneSignalService->sendFollowNotification($follower, $following);
            } catch (\Exception $e) {
                Log::error('Failed to send follow notification: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Successfully followed ' . ($following->name ?? $following->username),
                'is_following' => true
            ]);
        }

        return response()->json([
            'message' => 'You are already following this user',
            'is_following' => true
        ]);
    }

    /**
     * Unfollow a user
     */
    public function unfollow(Request $request, User $user)
    {
        $follower = $request->user();
        
        $deleted = Follower::where('follower_id', $follower->id)
            ->where('following_id', $user->id)
            ->delete();

        return response()->json([
            'message' => $deleted ? 'Successfully unfollowed user' : 'You were not following this user',
            'is_following' => false
        ]);
    }

    /**
     * Check if current user follows target user
     */
    public function check(Request $request, User $user)
    {
        $isFollowing = Follower::where('follower_id', $request->user()->id)
            ->where('following_id', $user->id)
            ->exists();

        return response()->json(['is_following' => $isFollowing]);
    }
}
