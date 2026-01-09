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
        try {
            if (!Schema::hasTable('followers')) {
                return response()->json(['message' => 'Follower system is temporarily unavailable'], 503);
            }

            $follower = $request->user();
            if (!$follower) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

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
        } catch (\Exception $e) {
            Log::error('Follow failed: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while trying to follow this user'], 500);
        }
    }

    /**
     * Unfollow a user
     */
    public function unfollow(Request $request, User $user)
    {
        try {
            if (!Schema::hasTable('followers')) {
                return response()->json(['message' => 'Follower system is temporarily unavailable'], 503);
            }

            $follower = $request->user();
            if (!$follower) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            
            $deleted = Follower::where('follower_id', $follower->id)
                ->where('following_id', $user->id)
                ->delete();

            return response()->json([
                'message' => $deleted ? 'Successfully unfollowed user' : 'You were not following this user',
                'is_following' => false
            ]);
        } catch (\Exception $e) {
            Log::error('Unfollow failed: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while trying to unfollow'], 500);
        }
    }

    /**
     * Check if current user follows target user
     */
    public function check(Request $request, User $user)
    {
        try {
            if (!Schema::hasTable('followers')) {
                return response()->json(['is_following' => false, 'error' => 'Table missing'], 200);
            }

            $currentUser = $request->user();
            if (!$currentUser) {
                return response()->json(['is_following' => false]);
            }

            Log::info('Checking follow status', [
                'follower' => $currentUser->id,
                'following' => $user->id
            ]);

            $isFollowing = Follower::where('follower_id', $currentUser->id)
                ->where('following_id', $user->id)
                ->exists();

            return response()->json(['is_following' => $isFollowing]);
        } catch (\Exception $e) {
            Log::error('Follow check failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
