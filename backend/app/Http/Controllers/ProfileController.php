<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Check if a username is available (unique)
     * Public endpoint for real-time validation
     */
    public function checkUsername(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string|min:3|max:255',
            'exclude_user_id' => 'sometimes|string', // UUID of user to exclude (for editing own profile)
        ]);

        $username = strtolower(trim($data['username']));
        
        // Build query to check username
        $query = User::where('username', $username);
        
        // Exclude current user if updating their own profile
        if (!empty($data['exclude_user_id'])) {
            $query->where('id', '!=', $data['exclude_user_id']);
        }
        
        $exists = $query->exists();
        
        return response()->json([
            'available' => !$exists,
            'username' => $username,
            'message' => $exists ? 'This username is already taken' : 'Username is available',
        ]);
    }

    public function me(Request $request)
    {
        // Load user with items relationship (including category) and location relationships
        // Items are ordered by latest first
        $user = $request->user()
            ->loadCount('items')
            ->load([
                'cityLocation', 
                'areaLocation',
                'items' => function ($query) {
                    $query->with('category')->latest();
                }
            ]);
        
        // Ensure city string field is populated from relationship for backward compatibility
        if ($user->cityLocation && !$user->city) {
            $user->city = $user->cityLocation->name;
            $user->save();
        }
        
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
        
        // Log incoming request data for debugging
        Log::info('Profile update request', [
            'user_id' => $user->id,
            'request_data' => $request->all(),
            'current_area_id' => $user->area_id,
            'current_city_id' => $user->city_id,
        ]);
        
        $data = $request->validate([
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'name' => 'sometimes|nullable|string|max:255',
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
                function ($attribute, $value, $fail) use ($request) {
                    // Allow null values
                    if ($value === null || $value === '' || $value === 'null') {
                        return;
                    }
                    // Validate that it's an integer
                    if (!is_numeric($value)) {
                        $fail('The area must be a valid number.');
                        return;
                    }
                    // Validate that the location exists and is an area
                    $area = Location::where('id', (int)$value)
                        ->where('type', 'area')
                        ->exists();
                    if (!$area) {
                        $fail('The selected area is invalid.');
                    }
                },
            ],
        ]);

        // Explicitly handle area_id - ensure it's always in $data if it was in the request
        // This is important because 'sometimes' rule might exclude null values
        if ($request->has('area_id')) {
            $requestAreaId = $request->input('area_id');
            if ($requestAreaId === null || $requestAreaId === '' || $requestAreaId === 'null') {
                $data['area_id'] = null;
                Log::info('Profile update: area_id explicitly set to null from request', [
                    'user_id' => $user->id,
                    'request_value' => $requestAreaId,
                ]);
            } else {
                // Ensure it's an integer
                $data['area_id'] = (int) $requestAreaId;
                Log::info('Profile update: area_id set from request', [
                    'user_id' => $user->id,
                    'area_id' => $data['area_id'],
                ]);
            }
        }
        
        // Log validated data
        Log::info('Profile update: validated data', [
            'user_id' => $user->id,
            'validated_data' => $data,
            'area_id_in_data' => $data['area_id'] ?? 'NOT_SET',
            'city_id_in_data' => $data['city_id'] ?? 'NOT_SET',
            'request_has_area_id' => $request->has('area_id'),
        ]);

        // Validate that area_id belongs to the selected city_id
        if (isset($data['area_id']) && $data['area_id'] !== null && isset($data['city_id'])) {
            // Validate that the area belongs to the selected city
            Log::info('Profile update: Validating area_id with city_id', [
                'user_id' => $user->id,
                'area_id' => $data['area_id'],
                'city_id' => $data['city_id'],
            ]);
            
            $area = Location::where('id', $data['area_id'])
                ->where('type', 'area')
                ->where('parent_id', $data['city_id'])
                ->first();

            if (!$area) {
                Log::warning('Profile update: Area does not belong to city', [
                    'user_id' => $user->id,
                    'area_id' => $data['area_id'],
                    'city_id' => $data['city_id'],
                ]);
                throw ValidationException::withMessages([
                    'area_id' => ['The selected area does not belong to the selected city.'],
                ]);
            }
            
            Log::info('Profile update: Area validation passed', [
                'user_id' => $user->id,
                'area_id' => $data['area_id'],
                'area_name' => $area->name,
            ]);
        } elseif (isset($data['area_id']) && $data['area_id'] !== null) {
            // If area_id is provided but city_id is not, validate against user's current city_id
            $cityId = $data['city_id'] ?? $user->city_id;
            
            Log::info('Profile update: Validating area_id with current city_id', [
                'user_id' => $user->id,
                'area_id' => $data['area_id'],
                'city_id' => $cityId,
            ]);
            
            if ($cityId) {
                $area = Location::where('id', $data['area_id'])
                    ->where('type', 'area')
                    ->where('parent_id', $cityId)
                    ->first();

                if (!$area) {
                    Log::warning('Profile update: Area does not belong to current city', [
                        'user_id' => $user->id,
                        'area_id' => $data['area_id'],
                        'city_id' => $cityId,
                    ]);
                    throw ValidationException::withMessages([
                        'area_id' => ['The selected area does not belong to your city. Please select a city first.'],
                    ]);
                }
                
                Log::info('Profile update: Area validation passed with current city', [
                    'user_id' => $user->id,
                    'area_id' => $data['area_id'],
                    'area_name' => $area->name,
                ]);
            }
        } elseif (isset($data['city_id']) && !isset($data['area_id'])) {
            // If city_id is being updated but area_id is not provided, 
            // check if current area_id belongs to new city, if not, clear it
            Log::info('Profile update: City changed, checking if current area belongs to new city', [
                'user_id' => $user->id,
                'new_city_id' => $data['city_id'],
                'current_area_id' => $user->area_id,
            ]);
            
            if ($user->area_id) {
                $currentArea = Location::where('id', $user->area_id)
                    ->where('type', 'area')
                    ->where('parent_id', $data['city_id'])
                    ->first();
                
                // If current area doesn't belong to new city, clear it
                if (!$currentArea) {
                    Log::info('Profile update: Current area does not belong to new city, clearing area_id', [
                        'user_id' => $user->id,
                        'old_area_id' => $user->area_id,
                        'new_city_id' => $data['city_id'],
                    ]);
                    $data['area_id'] = null;
                } else {
                    Log::info('Profile update: Current area belongs to new city, keeping area_id', [
                        'user_id' => $user->id,
                        'area_id' => $user->area_id,
                    ]);
                }
            }
        }
        
        // Log final data that will be saved
        Log::info('Profile update: Final data before save', [
            'user_id' => $user->id,
            'data_to_save' => $data,
            'area_id_to_save' => $data['area_id'] ?? 'NOT_SET',
        ]);

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
            // Log before fill
            Log::info('Profile update: Before fill', [
                'user_id' => $user->id,
                'current_area_id' => $user->area_id,
                'current_city_id' => $user->city_id,
                'data_to_fill' => $data,
                'area_id_in_fillable' => in_array('area_id', $user->getFillable()),
            ]);
            
            // Ensure area_id is explicitly set if it's in the data
            if (array_key_exists('area_id', $data)) {
                Log::info('Profile update: Explicitly setting area_id attribute', [
                    'user_id' => $user->id,
                    'area_id_value' => $data['area_id'],
                ]);
                $user->area_id = $data['area_id'];
            }
            
            $user->fill($data);
            
            // Log after fill, before save
            Log::info('Profile update: After fill, before save', [
                'user_id' => $user->id,
                'user_area_id' => $user->area_id,
                'user_city_id' => $user->city_id,
                'isDirty_area_id' => $user->isDirty('area_id'),
                'isDirty_city_id' => $user->isDirty('city_id'),
                'getDirty' => $user->getDirty(),
                'getOriginal_area_id' => $user->getOriginal('area_id'),
                'getOriginal_city_id' => $user->getOriginal('city_id'),
            ]);
            
            // Double-check area_id is set correctly before save
            if (array_key_exists('area_id', $data)) {
                if ($user->area_id != $data['area_id']) {
                    Log::warning('Profile update: area_id mismatch after fill, correcting', [
                        'user_id' => $user->id,
                        'expected_area_id' => $data['area_id'],
                        'actual_area_id' => $user->area_id,
                    ]);
                    $user->area_id = $data['area_id'];
                }
            }
            
            $saveResult = $user->save();
            
            Log::info('Profile update: Save result', [
                'user_id' => $user->id,
                'save_result' => $saveResult,
            ]);
            
            // Log after save
            Log::info('Profile update: After save', [
                'user_id' => $user->id,
                'saved_area_id' => $user->area_id,
                'saved_city_id' => $user->city_id,
            ]);
            
            // Reload user with relationships to get fresh data
            $user->refresh();
            $user->load(['cityLocation', 'areaLocation']);
            
            // Log after refresh
            Log::info('Profile update: After refresh', [
                'user_id' => $user->id,
                'refreshed_area_id' => $user->area_id,
                'refreshed_city_id' => $user->city_id,
                'areaLocation' => $user->areaLocation ? $user->areaLocation->name : null,
            ]);
            
            // Update city string field from relationship for backward compatibility
            // Always sync city field when city_id is set
            // IMPORTANT: Preserve area_id during this save
            $needsCityUpdate = false;
            if (isset($data['city_id']) && $user->cityLocation) {
                if ($user->city !== $user->cityLocation->name) {
                    $user->city = $user->cityLocation->name;
                    $needsCityUpdate = true;
                }
            } elseif ($user->cityLocation && !$user->city) {
                $user->city = $user->cityLocation->name;
                $needsCityUpdate = true;
            }
            
            // Only save if city needs updating, and preserve area_id
            if ($needsCityUpdate) {
                // Ensure area_id is preserved
                $currentAreaId = $user->area_id;
                $user->save();
                // Double-check area_id is still set after save
                if ($user->area_id !== $currentAreaId) {
                    Log::warning('Profile update: area_id was lost during city update, restoring', [
                        'user_id' => $user->id,
                        'expected_area_id' => $currentAreaId,
                        'actual_area_id' => $user->area_id,
                    ]);
                    $user->area_id = $currentAreaId;
                    $user->save();
                }
            }
        } catch (\Illuminate\Database\QueryException $e) {
            // Log database errors
            Log::error('Profile update: Database error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Handle database errors (like column size issues)
            if (str_contains($e->getMessage(), 'profile_photo') || str_contains($e->getMessage(), 'too long') || str_contains($e->getMessage(), 'Data too long')) {
                throw ValidationException::withMessages([
                    'profile_photo' => ['The profile photo path is too long. Please try selecting a different image or contact support.'],
                ]);
            }
            throw $e;
        } catch (\Exception $e) {
            // Log any other errors
            Log::error('Profile update: Unexpected error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }

        $freshUser = $user->fresh(['cityLocation', 'areaLocation']);
        
        // Log final response
        Log::info('Profile update: Success', [
            'user_id' => $user->id,
            'final_area_id' => $freshUser->area_id,
            'final_city_id' => $freshUser->city_id,
            'areaLocation_name' => $freshUser->areaLocation ? $freshUser->areaLocation->name : null,
        ]);

        return response()->json([
            'user' => $freshUser,
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
