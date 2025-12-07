<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user()->load(['items', 'cityLocation', 'areaLocation']);
        
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
            'bio' => 'sometimes|nullable|string|max:500',
            'profile_photo' => 'sometimes|nullable|string|max:65535', // TEXT field can hold up to 65,535 characters
            'city' => 'sometimes|string|max:255', // Keep for backward compatibility
            'city_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('locations', 'id')->where(function ($query) {
                    $query->where('type', 'city');
                }),
            ],
            'area_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('locations', 'id')->where(function ($query) {
                    $query->where('type', 'area');
                }),
            ],
        ]);

        // Validate that area_id belongs to the selected city_id
        if (isset($data['area_id']) && isset($data['city_id'])) {
            $area = Location::where('id', $data['area_id'])
                ->where('type', 'area')
                ->where('parent_id', $data['city_id'])
                ->first();

            if (!$area) {
                throw ValidationException::withMessages([
                    'area_id' => ['The selected area does not belong to the selected city.'],
                ]);
            }
        } elseif (isset($data['area_id'])) {
            // If area_id is provided but city_id is not, validate against user's current city_id
            $cityId = $data['city_id'] ?? $user->city_id;
            
            if ($cityId) {
                $area = Location::where('id', $data['area_id'])
                    ->where('type', 'area')
                    ->where('parent_id', $cityId)
                    ->first();

                if (!$area) {
                    throw ValidationException::withMessages([
                        'area_id' => ['The selected area does not belong to your city. Please select a city first.'],
                    ]);
                }
            }
        }

        // Check username change limit (24 hours) - but allow first-time setup
        if (isset($data['username']) && $data['username'] !== $user->username) {
            // Allow username change if username_updated_at is null (initial setup) or if username starts with 'user_' (auto-generated)
            $isInitialSetup = !$user->username_updated_at || 
                             (str_starts_with($user->username ?? '', 'user_') && strlen($user->username ?? '') === 11);
            
            if (!$isInitialSetup && $user->username_updated_at) {
                $hoursSinceUpdate = now()->diffInHours($user->username_updated_at);
                if ($hoursSinceUpdate < 24) {
                    $hoursRemaining = 24 - $hoursSinceUpdate;
                    throw ValidationException::withMessages([
                        'username' => ["You can only change your username once every 24 hours. Please wait {$hoursRemaining} more hours."],
                    ]);
                }
            }
            
            // Set username_updated_at timestamp
            $data['username_updated_at'] = now();
        }

        try {
            $user->fill($data);
            $user->save();
            
            // Reload user with relationships to get fresh data
            $user->refresh();
            $user->load(['cityLocation', 'areaLocation']);
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
            'user' => $user->fresh(['cityLocation', 'areaLocation']),
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

        // Verify current password exists and is correct
        if (!$user->password) {
            throw ValidationException::withMessages([
                'current_password' => ['No password is set for this account. Please set a password first.'],
            ]);
        }

        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Prevent using the same password
        if (Hash::check($data['new_password'], $user->password)) {
            throw ValidationException::withMessages([
                'new_password' => ['The new password must be different from your current password.'],
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
