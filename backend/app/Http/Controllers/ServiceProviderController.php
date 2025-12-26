<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ServiceProvider;
use App\Services\LocationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceProviderController extends Controller
{
    public function __construct(
        protected LocationService $locationService
    ) {}

    /**
     * Create or update a service provider profile
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Check if user already has a service provider profile
        $serviceProvider = $user->serviceProvider;
        
        $data = $request->validate([
            'service_category_id' => ['required', 'integer', 'exists:categories,id'],
            'starting_price' => 'nullable|numeric|min:0',
            'city' => 'required|string|max:255',
            'work_images' => 'nullable|array',
            'work_images.*' => 'string|max:2048',
            'bio' => 'nullable|string|max:1000',
            'availability' => ['nullable', Rule::in(['available', 'busy', 'unavailable'])],
        ]);

        // If profile exists, update it; otherwise create new
        if ($serviceProvider) {
            $serviceProvider->update($data);
            $serviceProvider->refresh();
        } else {
            $serviceProvider = ServiceProvider::create([
                ...$data,
                'user_id' => $user->id,
                'availability' => $data['availability'] ?? 'available',
            ]);
        }

        $serviceProvider->load(['user.cityLocation', 'user.areaLocation', 'serviceCategory']);

        return response()->json([
            'success' => true,
            'message' => $serviceProvider->wasRecentlyCreated ? 'Service profile created successfully' : 'Service profile updated successfully',
            'data' => $serviceProvider,
        ], $serviceProvider->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Get service provider feed for discover page
     */
    public function feed(Request $request)
    {
        $user = $request->user(); // Can be null if not authenticated
        $blockedIds = $user ? $this->blockedUserIds($user) : [];

        $query = ServiceProvider::with(['user.cityLocation', 'user.areaLocation', 'serviceCategory'])
            ->where('availability', '!=', 'unavailable'); // Only show available and busy providers
        
        // Only exclude user's own profile and blocked users if authenticated
        if ($user) {
            $query->where('user_id', '!=', $user->id);
            if (!empty($blockedIds)) {
                $query->whereNotIn('user_id', $blockedIds);
            }
        }
        
        $query->latest();

        // City filtering: case-insensitive comparison
        if (config('app.env') !== 'local' || !$request->boolean('ignore_city', false)) {
            if ($request->filled('city')) {
                $filterCity = trim((string) $request->string('city'));
                
                if (strtolower($filterCity) !== 'all') {
                    $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$filterCity]);
                }
            } else {
                if ($user && $user->city) {
                    $userCity = trim($user->city);
                    $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$userCity]);
                }
            }
        }

        // Filter by service category
        if ($request->filled('category')) {
            $categoryName = $request->string('category');
            if (is_numeric($categoryName)) {
                $query->where('service_category_id', $categoryName);
            } else {
                $category = Category::where('name', $categoryName)->first();
                if ($category) {
                    $query->where('service_category_id', $category->id);
                }
            }
        }

        $providers = $query->get();

        // Format providers for frontend consumption
        $providersArray = $providers->map(function ($provider) use ($user) {
            // Calculate distance if both users have location
            $distanceKm = null;
            if ($user && $user->hasLocation() && $provider->user && $provider->user->hasLocation()) {
                $distanceKm = $this->locationService->calculateDistance(
                    $user->latitude,
                    $user->longitude,
                    $provider->user->latitude,
                    $provider->user->longitude,
                    'km'
                );
                
                // Format distance based on size
                if ($distanceKm < 0.001) {
                    $distanceKm = $distanceKm;
                } elseif ($distanceKm < 0.1) {
                    $distanceKm = round($distanceKm, 4);
                } elseif ($distanceKm < 1) {
                    $distanceKm = round($distanceKm, 2);
                } else {
                    $distanceKm = round($distanceKm, 1);
                }
            }
            
            // Get work images array - default to empty array if null
            $workImages = $provider->work_images ?? [];
            $primaryImage = !empty($workImages) ? $workImages[0] : ($provider->user->profile_photo ?? 'https://via.placeholder.com/800');
            
            // Format starting price
            $startingPrice = null;
            if ($provider->starting_price) {
                $startingPrice = number_format($provider->starting_price, 0, '.', ',');
            }
            
            // Build response in frontend-expected format
            $formattedProvider = [
                'id' => $provider->id,
                'type' => 'services',
                'title' => $provider->serviceCategory->name ?? 'Service Provider',
                'description' => $provider->bio ?? '',
                'image' => $primaryImage,
                'images' => $workImages,
                'gallery' => $workImages,
                'starting_price' => $startingPrice,
                'price' => $startingPrice, // Alias for compatibility
                'rating' => $provider->rating ?? 0,
                'rating_count' => $provider->rating_count ?? 0,
                'availability' => $provider->availability,
                'distance' => $distanceKm,
                'distance_km' => $distanceKm,
                'user' => [
                    'id' => $provider->user->id,
                    'username' => $provider->user->username,
                    'profile_photo' => $provider->user->profile_photo ?? null,
                    'city' => $provider->user->cityLocation->name ?? $provider->user->city ?? 'Unknown',
                    'area' => $provider->user->areaLocation->name ?? null,
                    'city_id' => $provider->user->city_id,
                    'area_id' => $provider->user->area_id,
                    'phone_verified_at' => $provider->user->phone_verified_at?->toIso8601String() ?? null,
                ],
                'owner' => [
                    'id' => $provider->user->id,
                    'name' => $provider->user->username,
                    'image' => $provider->user->profile_photo ?? null,
                    'location' => $this->formatUserLocation($provider->user),
                    'distance' => $distanceKm !== null ? ($distanceKm < 1 ? round($distanceKm * 1000) . 'm' : $distanceKm . 'km') : 'Unknown',
                    'phone_verified_at' => $provider->user->phone_verified_at?->toIso8601String() ?? null,
                ],
                'category' => $provider->serviceCategory->name ?? null,
                'category_id' => $provider->service_category_id,
                'service_category_id' => $provider->service_category_id,
                'city' => $provider->city,
                'created_at' => $provider->created_at,
                'updated_at' => $provider->updated_at,
            ];
            
            return $formattedProvider;
        });

        return response()->json([
            'items' => $providersArray,
            'data' => $providersArray, // Also include as 'data' for compatibility
        ]);
    }

    /**
     * Get current user's service provider profile
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            // Return 200 with success: false to distinguish from route not found (404)
            // This allows frontend to handle "no profile" vs "route doesn't exist" differently
            return response()->json([
                'success' => false,
                'message' => 'No service profile found',
                'data' => null,
            ], 200);
        }

        $serviceProvider->load(['serviceCategory', 'user.cityLocation', 'user.areaLocation']);

        return response()->json([
            'success' => true,
            'data' => $serviceProvider,
        ]);
    }

    /**
     * Format user location as "City, Area" or just "City"
     */
    private function formatUserLocation($user): string
    {
        $city = $user->cityLocation->name ?? $user->city ?? 'Unknown';
        $area = $user->areaLocation->name ?? null;
        
        if ($area) {
            return "{$city}, {$area}";
        }
        
        return $city;
    }
}

