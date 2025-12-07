<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use App\Services\LocationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    public function __construct(
        protected LocationService $locationService
    ) {}

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'condition' => ['required', Rule::in(['new', 'like_new', 'used'])],
            'photos' => 'nullable|array|min:1',
            'photos.*' => 'string|max:2048',
            'type' => ['nullable', Rule::in(['barter', 'marketplace'])],
            'price' => 'nullable|numeric|min:0|required_if:type,marketplace',
            'looking_for' => 'nullable|string|max:255|required_if:type,barter',
            'city' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        
        // Default to 'barter' if type is not provided
        $type = $data['type'] ?? 'barter';
        
        // For marketplace items, ensure price is provided and looking_for is null
        // For barter items, ensure looking_for is provided and price is null
        if ($type === 'marketplace') {
            if (empty($data['price'])) {
                return response()->json(['message' => 'Price is required for marketplace items'], 422);
            }
            $data['looking_for'] = null;
        } else {
            if (empty($data['looking_for'])) {
                return response()->json(['message' => 'looking_for is required for barter items'], 422);
            }
            $data['price'] = null;
        }
        
        $item = Item::create([
            ...$data,
            'type' => $type,
            'user_id' => $user->id,
            'city' => $data['city'] ?? $user->city,
            'status' => 'active',
        ]);

        $item->load(['user.cityLocation', 'user.areaLocation']);
        
        return response()->json(['item' => $item], 201);
    }

    public function feed(Request $request)
    {
        $user = $request->user(); // Can be null if not authenticated
        $blockedIds = $user ? $this->blockedUserIds($user) : [];

        $query = Item::with(['user.cityLocation', 'user.areaLocation', 'category'])
            ->where('status', 'active');
        
        // Only exclude user's own items and blocked users if authenticated
        if ($user) {
            $query->where('user_id', '!=', $user->id);
            if (!empty($blockedIds)) {
                $query->whereNotIn('user_id', $blockedIds);
            }
        }
        
        $query->latest();

        // City filtering: case-insensitive comparison
        // Allow city filter via query parameter, or use user's city as default
        // In development mode (local), allow bypassing city filter for testing via ?ignore_city=1
        if (config('app.env') !== 'local' || !$request->boolean('ignore_city', false)) {
            if ($request->filled('city')) {
                $filterCity = trim((string) $request->string('city'));
                
                if (strtolower($filterCity) !== 'all') {
                    // Use provided city for filtering (case-insensitive)
                    $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$filterCity]);
                }
                // If city='all', don't apply city filter (show all cities)
            } else {
                // No city parameter provided
                if ($user && $user->city) {
                    // If authenticated, use user's city as default
                    $userCity = trim($user->city);
                    $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$userCity]);
                } else {
                    // If not authenticated or user has no city, show all items (no city filter)
                    // This allows unauthenticated users to browse all items
                }
            }
        }

        // Filter by category_id (from Category model)
        if ($request->filled('category')) {
            $categoryName = $request->string('category');
            // Allow filtering by category name or ID
            if (is_numeric($categoryName)) {
                $query->where('category_id', $categoryName);
            } else {
                // Find category by name
                $category = Category::where('name', $categoryName)->first();
                if ($category) {
                    $query->where('category_id', $category->id);
                }
            }
        }

        // Filter by type (barter or marketplace)
        // Note: Services tab is coming soon, so we don't handle 'services' type here
        if ($request->filled('type')) {
            $type = $request->string('type');
            if (in_array($type, ['barter', 'marketplace'])) {
                $query->where('type', $type);
            }
        }

        $items = $query->get();

        // Format items for frontend consumption
        $itemsArray = $items->map(function ($item) use ($user) {
            // Calculate distance if both users have location (only if authenticated)
            $distanceKm = null;
            if ($user && $user->hasLocation() && $item->user && $item->user->hasLocation()) {
                $distanceKm = $this->locationService->calculateDistance(
                    $user->latitude,
                    $user->longitude,
                    $item->user->latitude,
                    $item->user->longitude,
                    'km'
                );
                
                // Format distance based on size
                if ($distanceKm < 0.001) {
                    $distanceKm = $distanceKm; // Keep full precision
                } elseif ($distanceKm < 0.1) {
                    $distanceKm = round($distanceKm, 4);
                } elseif ($distanceKm < 1) {
                    $distanceKm = round($distanceKm, 2);
                } else {
                    $distanceKm = round($distanceKm, 1);
                }
            }
            
            // Get photos array - default to empty array if null
            $photos = $item->photos ?? [];
            $primaryImage = !empty($photos) ? $photos[0] : 'https://via.placeholder.com/800';
            
            // Format price for marketplace items (with commas)
            $price = null;
            if ($item->type === 'marketplace' && $item->price) {
                $price = number_format($item->price, 0, '.', ',');
            }
            
            // Build response in frontend-expected format
            $formattedItem = [
                'id' => $item->id,
                'type' => $item->type ?? 'barter',
                'title' => $item->title,
                'condition' => ucfirst(str_replace('_', ' ', $item->condition)),
                'image' => $primaryImage,
                'images' => $photos,
                'description' => $item->description ?? '',
                'gallery' => $photos,
                'distance' => $distanceKm,
                'distance_km' => $distanceKm,
                'user' => [
                    'id' => $item->user->id,
                    'username' => $item->user->username,
                    'profile_photo' => $item->user->profile_photo ?? 'https://i.pravatar.cc/150',
                    'city' => $item->user->cityLocation->name ?? $item->user->city ?? 'Unknown',
                    'area' => $item->user->areaLocation->name ?? null,
                    'city_id' => $item->user->city_id,
                    'area_id' => $item->user->area_id,
                ],
                'owner' => [
                    'name' => $item->user->username,
                    'image' => $item->user->profile_photo ?? 'https://i.pravatar.cc/150',
                    'location' => $this->formatUserLocation($item->user), // Format city and area
                    'distance' => $distanceKm !== null ? ($distanceKm < 1 ? round($distanceKm * 1000) . 'm' : $distanceKm . 'km') : 'Unknown',
                ],
            ];
            
            // Add type-specific fields
            if ($item->type === 'marketplace') {
                $formattedItem['price'] = $price;
            } else {
                $formattedItem['looking_for'] = $item->looking_for ?? '';
                $formattedItem['lookingFor'] = $item->looking_for ?? '';
            }
            
            // Include all original fields for backward compatibility
            $formattedItem['category'] = $item->category->name ?? null;
            $formattedItem['category_id'] = $item->category_id;
            $formattedItem['city'] = $item->city;
            $formattedItem['status'] = $item->status;
            $formattedItem['created_at'] = $item->created_at;
            $formattedItem['updated_at'] = $item->updated_at;
            
            return $formattedItem;
        });

        return response()->json([
            'items' => $itemsArray,
            'data' => $itemsArray, // Also include as 'data' for compatibility
        ]);
    }

    public function show(Request $request, Item $item)
    {
        if ($this->isBlockedBetween($request->user(), $item->user_id)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $item->load(['user.cityLocation', 'user.areaLocation']);
        
        // Calculate distance if both users have location
        $user = $request->user();
        if ($user->hasLocation() && $item->user && $item->user->hasLocation()) {
            $distanceKm = $this->locationService->calculateDistance(
                $user->latitude,
                $user->longitude,
                $item->user->latitude,
                $item->user->longitude,
                'km'
            );
            $distanceMiles = $this->locationService->kmToMiles($distanceKm);
            
            $item->distance_km = round($distanceKm, 1);
            $item->distance_miles = round($distanceMiles, 1);
        } else {
            $item->distance_km = null;
            $item->distance_miles = null;
        }

        return response()->json(['item' => $item]);
    }

    public function update(Request $request, Item $item)
    {
        $this->authorizeItemOwnership($request->user()->id, $item);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'condition' => ['sometimes', Rule::in(['new', 'like_new', 'used'])],
            'photos' => 'sometimes|array|min:1',
            'photos.*' => 'string|max:2048',
            'looking_for' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'status' => ['sometimes', Rule::in(['active', 'swapped'])],
        ]);

        $item->update($data);

        return response()->json(['item' => $item]);
    }

    public function destroy(Request $request, Item $item)
    {
        $this->authorizeItemOwnership($request->user()->id, $item);
        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }

    private function authorizeItemOwnership(string $userId, Item $item): void
    {
        if ($item->user_id !== $userId) {
            abort(403, 'You can only manage your own items');
        }
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
