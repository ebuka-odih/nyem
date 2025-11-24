<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user()->load('items');
        
        // Check if username can be changed (24hr limit)
        $canChangeUsername = true;
        if ($user->username_updated_at) {
            $hoursSinceUpdate = now()->diffInHours($user->username_updated_at);
            $canChangeUsername = $hoursSinceUpdate >= 24;
        }
        
        return response()->json([
            'user' => $user,
            'can_change_username' => $canChangeUsername,
            'username_next_change' => $canChangeUsername ? null : $user->username_updated_at->addHours(24)->toIso8601String(),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        
        $data = $request->validate([
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'bio' => 'sometimes|nullable|string',
            'profile_photo' => 'sometimes|nullable|string|max:65535', // TEXT field can hold up to 65,535 characters
            'city' => 'sometimes|string|max:255',
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        // Check username change limit (24 hours)
        if (isset($data['username']) && $data['username'] !== $user->username) {
            if ($user->username_updated_at) {
                $hoursSinceUpdate = now()->diffInHours($user->username_updated_at);
                if ($hoursSinceUpdate < 24) {
                    $hoursRemaining = 24 - $hoursSinceUpdate;
                    throw ValidationException::withMessages([
                        'username' => ["You can only change your username once every 24 hours. Please wait {$hoursRemaining} more hours."],
                    ]);
                }
            }
            $data['username_updated_at'] = now();
        }

        try {
            $user->fill($data);
            if (isset($data['password']) && $data['password']) {
                $user->password = Hash::make($data['password']);
            }
            $user->save();
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database errors (like column size issues)
            if (str_contains($e->getMessage(), 'profile_photo') || str_contains($e->getMessage(), 'too long') || str_contains($e->getMessage(), 'Data too long')) {
                throw ValidationException::withMessages([
                    'profile_photo' => ['The profile photo path is too long. Please try selecting a different image or contact support.'],
                ]);
            }
            throw $e;
        }

        return response()->json([
            'user' => $user,
            'message' => 'Profile updated successfully',
        ]);
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        // Verify current password
        if (!$user->password || !Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password
        $user->password = Hash::make($data['new_password']);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }
}
