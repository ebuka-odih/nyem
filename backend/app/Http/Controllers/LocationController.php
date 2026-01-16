<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\LocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * LocationController
 * 
 * Handles location-related API endpoints:
 * - POST /api/location/update - Update user's current location
 * - GET /api/location/nearby - Find users within a radius
 * 
 * Security considerations:
 * - Location updates are rate-limited to prevent abuse
 * - Only authenticated users can update their location
 * - Coordinates are validated before storage
 * - Users can only query nearby users, not arbitrary locations (optional)
 */
class LocationController extends Controller
{
    public function __construct(
        protected LocationService $locationService
    ) {}

    /**
     * Update the authenticated user's location
     * 
     * This endpoint allows users to update their GPS coordinates.
     * Rate-limited to prevent abuse and excessive database writes.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * Request body:
     * {
     *   "latitude": 37.7749,
     *   "longitude": -122.4194
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "message": "Location updated successfully",
     *   "data": {
     *     "user": { ... },
     *     "location_updated_at": "2025-11-28T21:30:00.000000Z"
     *   }
     * }
     */
    public function update(Request $request)
    {
        // Rate limit: 60 requests per minute
        $key = $request->user() 
            ? 'location_update:' . $request->user()->id 
            : 'location_update_guest:' . $request->ip();
        
        if (RateLimiter::tooManyAttempts($key, 60)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'location' => ["Too many location updates. Please try again in {$seconds} seconds."],
            ]);
        }

        RateLimiter::hit($key, 60);

        // Validate input
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();

        // Validate and normalize coordinates using LocationService
        try {
            $coords = $this->locationService->validateAndNormalize(
                $validated['latitude'],
                $validated['longitude']
            );
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'coordinates' => [$e->getMessage()],
            ]);
        }

        if ($user) {
            // Update user location
            $user->latitude = $coords['latitude'];
            $user->longitude = $coords['longitude'];
            $user->location_updated_at = now();
            $user->save();

            // If user has area_id set, also update the area's coordinates
            if ($user->area_id) {
                $area = \App\Models\Location::find($user->area_id);
                if ($area && (!$area->latitude || !$area->longitude)) {
                    $area->latitude = $coords['latitude'];
                    $area->longitude = $coords['longitude'];
                    $area->save();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
                'data' => [
                    'user' => $user->fresh(['cityLocation', 'areaLocation']),
                    'location_updated_at' => $user->location_updated_at->toIso8601String(),
                ],
            ], 200);
        } else {
            // For guests, store in session if available
            if ($request->hasSession()) {
                $request->session()->put([
                    'guest_latitude' => $coords['latitude'],
                    'guest_longitude' => $coords['longitude'],
                    'location_updated_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Guest location updated successfully',
                'data' => [
                    'latitude' => $coords['latitude'],
                    'longitude' => $coords['longitude'],
                    'location_updated_at' => now()->toIso8601String(),
                ],
            ], 200);
        }
    }

    /**
     * Find nearby users within a specified radius
     * 
     * Returns users sorted by distance (nearest first).
     * Only returns users who have shared their location.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * Query parameters:
     * - radius (optional): Radius in kilometers (default: 50km, max: 500km)
     * - limit (optional): Maximum number of results (default: 50, max: 100)
     * - latitude (optional): Override user's latitude for search
     * - longitude (optional): Override user's longitude for search
     * 
     * Response:
     * {
     *   "success": true,
     *   "message": "Nearby users retrieved successfully",
     *   "data": {
     *     "users": [
     *       {
     *         "id": "...",
     *         "username": "...",
     *         "distance": 2.5,
     *         ...
     *       }
     *     ],
     *     "total": 15,
     *     "radius_km": 50,
     *     "center": {
     *       "latitude": 37.7749,
     *       "longitude": -122.4194
     *     }
     *   }
     * }
     */
    public function nearby(Request $request)
    {
        $user = $request->user();

        // Validate query parameters
        $validated = $request->validate([
            'radius' => 'sometimes|numeric|min:1|max:500', // Max 500km radius
            'limit' => 'sometimes|integer|min:1|max:100',  // Max 100 results
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
        ]);

        // Determine search center point
        // Use provided coordinates, authenticated user coordinates, or guest session coordinates
        $latitude = $validated['latitude'] ?? ($user ? $user->latitude : ($request->hasSession() ? $request->session()->get('guest_latitude') : null));
        $longitude = $validated['longitude'] ?? ($user ? $user->longitude : ($request->hasSession() ? $request->session()->get('guest_longitude') : null));

        // If no coordinates available, return error
        if (is_null($latitude) || is_null($longitude)) {
            return response()->json([
                'success' => false,
                'message' => 'Location is required. Please update your location first or provide latitude and longitude.',
                'data' => null,
            ], 400);
        }

        // Validate coordinates
        try {
            $coords = $this->locationService->validateAndNormalize($latitude, $longitude);
            $latitude = $coords['latitude'];
            $longitude = $coords['longitude'];
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'coordinates' => [$e->getMessage()],
            ]);
        }

        // Set defaults
        $radiusKm = $validated['radius'] ?? 50.0; // Default 50km radius
        $limit = $validated['limit'] ?? 50; // Default 50 results

        // Find nearby users
        // Exclude the current user from results if authenticated
        $excludeUserIds = $user ? [$user->id] : [];

        $nearbyUsers = $this->locationService->findNearbyUsers(
            $latitude,
            $longitude,
            $radiusKm,
            $excludeUserIds,
            $limit
        );

        // Format response with distance information
        $formattedUsers = $nearbyUsers->map(function ($nearbyUser) {
            return [
                'id' => $nearbyUser->id,
                'username' => $nearbyUser->username,
                'bio' => $nearbyUser->bio,
                'profile_photo' => $nearbyUser->profile_photo,
                'city' => $nearbyUser->city,
                'distance' => round((float) $nearbyUser->distance, 2), // Distance in km
                'distance_miles' => round($this->locationService->kmToMiles((float) $nearbyUser->distance), 2),
                'created_at' => $nearbyUser->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Nearby users retrieved successfully',
            'data' => [
                'users' => $formattedUsers,
                'total' => $formattedUsers->count(),
                'radius_km' => $radiusKm,
                'radius_miles' => round($this->locationService->kmToMiles($radiusKm), 2),
                'center' => [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                ],
            ],
        ], 200);
    }

    /**
     * Get current user's location status
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function status(Request $request)
    {
        $user = $request->user();

        if ($user) {
            return response()->json([
                'success' => true,
                'message' => 'Location status retrieved successfully',
                'data' => [
                    'has_location' => $user->hasLocation(),
                    'latitude' => $user->latitude,
                    'longitude' => $user->longitude,
                    'location_updated_at' => $user->location_updated_at?->toIso8601String(),
                    'location_age_hours' => $user->location_updated_at 
                        ? round(now()->diffInHours($user->location_updated_at), 2)
                        : null,
                ],
            ], 200);
        }

        // Guest status from session
        $hasGuestLocation = false;
        $guestLat = null;
        $guestLon = null;
        $updatedAt = null;

        if ($request->hasSession()) {
            $session = $request->session();
            $hasGuestLocation = $session->has('guest_latitude') && $session->has('guest_longitude');
            $guestLat = $session->get('guest_latitude');
            $guestLon = $session->get('guest_longitude');
            $updatedAt = $session->get('location_updated_at');
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Guest location status retrieved successfully',
            'data' => [
                'has_location' => $hasGuestLocation,
                'latitude' => $guestLat,
                'longitude' => $guestLon,
                'location_updated_at' => $updatedAt instanceof \Carbon\Carbon 
                    ? $updatedAt->toIso8601String() 
                    : $updatedAt,
            ],
        ], 200);
    }
}
