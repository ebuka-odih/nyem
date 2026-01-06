<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;

/**
 * GeographicController
 * 
 * Handles geographic reference data (cities, areas) for the application.
 * This is static lookup data, separate from user GPS coordinates.
 * 
 * Note: User GPS coordinates are handled by LocationController.
 */
class GeographicController extends Controller
{
    /**
     * Get all cities
     * 
     * Backward compatibility endpoint - returns cities
     * Use /locations/cities for the newer endpoint
     */
    public function locations()
    {
        // Return cities for backward compatibility
        $locations = Location::cities()->active()->ordered()->get(['id', 'name', 'slug', 'sort_order']);
        return response()->json(['locations' => $locations]);
    }

    /**
     * Get all cities
     */
    public function cities()
    {
        $cities = Location::cities()->active()->ordered()->get([
            'id',
            'name',
            'slug',
            'description',
            'sort_order'
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'cities' => $cities
            ]
        ]);
    }

    /**
     * Get areas for a specific city
     * 
     * Supports both route parameter and query parameter:
     * - /locations/cities/{cityId}/areas
     * - /locations/areas?city_id={cityId}
     */
    public function areas(Request $request, $cityId = null)
    {
        try {
            // Support both route parameter and query parameter
            $cityId = $cityId ?? $request->query('city_id');

            if (!$cityId) {
                return response()->json([
                    'success' => false,
                    'message' => 'City ID is required',
                ], 422);
            }

            // Validate that the city exists and is actually a city
            $city = Location::where('id', $cityId)
                ->where('type', 'city')
                ->first();

            if (!$city) {
                return response()->json([
                    'success' => false,
                    'message' => 'City not found',
                ], 404);
            }

            // Get all areas for this city
            // Use query() to explicitly start a query builder and avoid conflict with relationship method
            $areas = Location::query()
                ->where('type', 'area')
                ->where('parent_id', $cityId)
                ->active()
                ->ordered()
                ->get([
                    'id',
                    'name',
                    'slug',
                    'description',
                    'parent_id',
                    'sort_order'
                ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'city' => [
                        'id' => $city->id,
                        'name' => $city->name,
                        'slug' => $city->slug,
                    ],
                    'areas' => $areas
                ]
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Error fetching areas for city ' . $cityId . ': ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch areas. Please try again later.',
            ], 500);
        }
    }
}


