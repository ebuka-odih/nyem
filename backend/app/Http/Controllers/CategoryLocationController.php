<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\Request;

class CategoryLocationController extends Controller
{
    public function categories(Request $request)
    {
        $query = Category::query();
        
        // Filter by parent category if provided (e.g., ?parent=Shop, ?parent=Services, ?parent=Swap)
        if ($request->filled('parent')) {
            $parentName = $request->string('parent');
            $parentCategory = Category::where('name', $parentName)
                ->where('type', 'main')
                ->first();
            
            if ($parentCategory) {
                // Return only sub-categories of this parent
                $query->where('parent_id', $parentCategory->id)
                    ->where('type', 'sub');
            } else {
                // Parent not found, return empty array
                return response()->json(['categories' => []]);
            }
        } else {
            // If no parent specified, return only sub-categories (exclude main categories)
            $query->where('type', 'sub');
        }
        
        $categories = $query->orderBy('order')->get(['id', 'name', 'order']);
        return response()->json(['categories' => $categories]);
    }

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
