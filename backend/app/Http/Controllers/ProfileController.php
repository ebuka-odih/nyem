<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\User;
use App\Models\UserNotificationSetting;
use App\Models\Transaction;
use App\Models\PersonalAccessToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

use App\Services\PaystackService;

class ProfileController extends Controller
{
    protected $paystackService;

    public function __construct(PaystackService $paystackService)
    {
        $this->paystackService = $paystackService;
    }
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
        // Load user with listings relationship (including category) and location relationships
        // Listings are ordered by latest first
        $user = $request->user()
            ->loadCount('listings')
            ->load([
                'cityLocation', 
                'areaLocation',
                'listings' => function ($query) {
                    $query->with('category')
                        ->withCount(['views', 'likes', 'stars', 'shares'])
                        ->latest();
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

    /**
     * Show any user profile (public)
     */
    public function show($id)
    {
        $user = User::where('id', $id)
            ->withCount('listings')
            ->with([
                'cityLocation', 
                'areaLocation',
                'listings' => function ($query) {
                    $query->with('category')
                        ->withCount(['views', 'likes', 'stars', 'shares'])
                        ->latest();
                }
            ])
            ->firstOrFail();
            
        // Ensure city string field is populated from relationship for backward compatibility
        if ($user->cityLocation && !$user->city) {
            $user->city = $user->cityLocation->name;
            $user->save();
        }
            
        return response()->json([
            'user' => $user,
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
                'integer',
                Rule::exists('locations', 'id')->where(function ($query) {
                    $query->where('type', 'area');
                }),
            ],
            'onesignal_player_id' => 'sometimes|nullable|string|max:255',
        ]);

        // Explicitly handle area_id - ensure it's always in $data if it was in the request
        // This is important because 'sometimes' rule might exclude null values
        // Also handle the case where validation might have excluded it
        if ($request->has('area_id')) {
            $requestAreaId = $request->input('area_id');
            if ($requestAreaId === null || $requestAreaId === '' || $requestAreaId === 'null') {
                $data['area_id'] = null;
                Log::info('Profile update: area_id explicitly set to null from request', [
                    'user_id' => $user->id,
                    'request_value' => $requestAreaId,
                ]);
            } else {
                // Ensure it's an integer and add to data if not already there
                $areaIdValue = (int) $requestAreaId;
                $data['area_id'] = $areaIdValue;
                Log::info('Profile update: area_id set from request', [
                    'user_id' => $user->id,
                    'area_id' => $data['area_id'],
                    'was_in_validated_data' => isset($data['area_id']),
                ]);
            }
        } else {
            // If area_id was not in request but is in validated data, keep it
            // This handles edge cases
            Log::info('Profile update: area_id not in request', [
                'user_id' => $user->id,
                'area_id_in_validated' => $data['area_id'] ?? 'NOT_SET',
            ]);
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
                'area_id_in_data' => array_key_exists('area_id', $data),
            ]);
            
            // CRITICAL: Explicitly set area_id BEFORE fill() to ensure it's saved
            // This handles cases where fill() might not include it
            if (array_key_exists('area_id', $data)) {
                $areaIdValue = $data['area_id'];
                Log::info('Profile update: Explicitly setting area_id attribute before fill', [
                    'user_id' => $user->id,
                    'area_id_value' => $areaIdValue,
                    'area_id_type' => gettype($areaIdValue),
                ]);
                // Set it directly on the model
                $user->setAttribute('area_id', $areaIdValue);
            }
            
            // Now fill the rest of the data
            $user->fill($data);
            
            // After fill, verify area_id is still set correctly
            if (array_key_exists('area_id', $data)) {
                if ($user->getAttribute('area_id') != $data['area_id']) {
                    Log::warning('Profile update: area_id was changed during fill, restoring', [
                        'user_id' => $user->id,
                        'expected' => $data['area_id'],
                        'actual' => $user->getAttribute('area_id'),
                    ]);
                    $user->setAttribute('area_id', $data['area_id']);
                }
            }
            
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
            
            // Capture coordinates from area or city location if user doesn't have GPS coordinates
            // Priority: Keep existing GPS if available, otherwise use area coordinates, then city coordinates
            if (!$user->hasLocation()) {
                $location = null;
                if ($user->area_id && $user->areaLocation) {
                    $location = $user->areaLocation;
                } elseif ($user->city_id && $user->cityLocation) {
                    $location = $user->cityLocation;
                }
                
                if ($location && $location->latitude && $location->longitude) {
                    $user->latitude = $location->latitude;
                    $user->longitude = $location->longitude;
                    $user->location_updated_at = now();
                    $user->save();
                    Log::info('Profile update: Set user coordinates from location', [
                        'user_id' => $user->id,
                        'location_type' => $location->type,
                        'location_name' => $location->name,
                        'latitude' => $user->latitude,
                        'longitude' => $user->longitude,
                    ]);
                }
            }
            
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

    /**
     * Get notification settings for the authenticated user
     */
    public function getNotificationSettings(Request $request)
    {
        $user = $request->user();
        
        // Get or create notification settings with defaults
        $settings = $user->notificationSettings()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'push_enabled' => true,
                'email_enabled' => true,
                'sms_enabled' => false,
                'trade_alerts' => true,
                'message_alerts' => true,
                'match_alerts' => true,
            ]
        );

        return response()->json([
            'settings' => $settings,
        ]);
    }

    /**
     * Update notification settings for the authenticated user
     */
    public function updateNotificationSettings(Request $request)
    {
        $user = $request->user();
        
        $data = $request->validate([
            'push_enabled' => 'sometimes|boolean',
            'email_enabled' => 'sometimes|boolean',
            'sms_enabled' => 'sometimes|boolean',
            'trade_alerts' => 'sometimes|boolean',
            'message_alerts' => 'sometimes|boolean',
            'match_alerts' => 'sometimes|boolean',
        ]);

        $settings = $user->notificationSettings()->updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        return response()->json([
            'settings' => $settings,
            'message' => 'Notification settings updated successfully',
        ]);
    }

    /**
     * Get escrow and payment settings for the authenticated user
     */
    public function getPaymentSettings(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'escrow_enabled' => $user->escrow_enabled ?? true,
            'bank_details' => [
                'bank_name' => $user->bank_name,
                'account_number' => $user->account_number,
                'account_name' => $user->account_name,
            ],
        ]);
    }

    /**
     * Update escrow and payment settings for the authenticated user
     */
    public function updatePaymentSettings(Request $request)
    {
        $user = $request->user();
        
        $data = $request->validate([
            'escrow_enabled' => 'sometimes|boolean',
            'bank_name' => 'sometimes|nullable|string|max:255',
            'account_number' => 'sometimes|nullable|string|max:255',
            'account_name' => 'sometimes|nullable|string|max:255',
        ]);

        $user->fill($data);
        $user->save();

        return response()->json([
            'escrow_enabled' => $user->escrow_enabled,
            'bank_details' => [
                'bank_name' => $user->bank_name,
                'account_number' => $user->account_number,
                'account_name' => $user->account_name,
            ],
            'message' => 'Payment settings updated successfully',
        ]);
    }

    /**
     * Get list of banks for payments
     */
    public function getBanks()
    {
        $banks = $this->paystackService->getBanks();
        return response()->json(['banks' => $banks]);
    }

    /**
     * Verify bank account details
     */
    public function verifyBankAccount(Request $request)
    {
        $request->validate([
            'account_number' => 'required|string',
            'bank_code' => 'required|string',
        ]);

        $accountName = $this->paystackService->resolveAccountNumber(
            $request->account_number, 
            $request->bank_code
        );

        if (!$accountName) {
             return response()->json(['message' => 'Could not verify account details.'], 400);
        }

        return response()->json(['account_name' => $accountName['account_name']]);
    }

    /**
     * Update OneSignal player ID for push notifications
     */
    public function updateOneSignalPlayerId(Request $request)
    {
        $data = $request->validate([
            'onesignal_player_id' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $user->onesignal_player_id = $data['onesignal_player_id'];
        $user->save();

        return response()->json([
            'message' => 'OneSignal player ID updated successfully',
            'onesignal_player_id' => $user->onesignal_player_id,
        ]);
    }

    /**
     * Get security settings and information for the authenticated user
     */
    public function getSecuritySettings(Request $request)
    {
        $user = $request->user();
        
        // Get active sessions (tokens) for the user
        $activeTokens = $user->tokens()
            ->select('id', 'name', 'last_used_at', 'created_at')
            ->orderBy('last_used_at', 'desc')
            ->get()
            ->map(function ($token) {
                return [
                    'id' => $token->id,
                    'name' => $token->name ?? 'Unknown Device',
                    'last_used_at' => $token->last_used_at?->toIso8601String(),
                    'created_at' => $token->created_at->toIso8601String(),
                    'is_current' => false, // Will be set by frontend based on current token
                ];
            });

        return response()->json([
            'two_factor_enabled' => !is_null($user->phone_verified_at),
            'email_verified' => !is_null($user->email_verified_at),
            'phone_verified' => !is_null($user->phone_verified_at),
            'active_sessions' => $activeTokens,
        ]);
    }

    /**
     * Get trade history (transactions) for the authenticated user
     */
    public function getTradeHistory(Request $request)
    {
        $user = $request->user();
        
        $perPage = $request->get('per_page', 20);
        $type = $request->get('type'); // 'purchase', 'sale', or null for all
        
        // Build query for transactions where user is buyer or seller
        $query = Transaction::with(['listing', 'buyer', 'seller'])
            ->where(function ($q) use ($user) {
                $q->where('buyer_id', $user->id)
                  ->orWhere('seller_id', $user->id);
            });

        // Filter by type
        if ($type === 'purchase') {
            $query->where('buyer_id', $user->id);
        } elseif ($type === 'sale') {
            $query->where('seller_id', $user->id);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Format transactions for frontend
        $formattedTransactions = $transactions->map(function ($transaction) use ($user) {
            $isPurchase = $transaction->buyer_id === $user->id;
            
            return [
                'id' => $transaction->id,
                'type' => $isPurchase ? 'PURCHASE' : 'SALE',
                'listing' => [
                    'id' => $transaction->listing->id ?? null,
                    'title' => $transaction->listing->title ?? 'Unknown Listing',
                    'image' => !empty($transaction->listing->photos) ? $transaction->listing->photos[0] : null,
                ],
                'amount' => number_format($transaction->amount, 0, '.', ','),
                'price' => '₦' . number_format($transaction->amount, 0, '.', ','),
                'status' => strtoupper($transaction->status ?? 'pending'),
                'date' => $transaction->created_at->format('M d, Y'),
                'completed_at' => $transaction->completed_at?->toIso8601String(),
                'counterparty' => $isPurchase 
                    ? [
                        'id' => $transaction->seller->id ?? null,
                        'username' => $transaction->seller->username ?? 'Unknown',
                        'name' => $transaction->seller->name ?? $transaction->seller->username ?? 'Unknown',
                    ]
                    : [
                        'id' => $transaction->buyer->id ?? null,
                        'username' => $transaction->buyer->username ?? 'Unknown',
                        'name' => $transaction->buyer->name ?? $transaction->buyer->username ?? 'Unknown',
                    ],
            ];
        });

        return response()->json([
            'transactions' => $formattedTransactions,
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }
}
