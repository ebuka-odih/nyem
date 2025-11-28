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

    private function getCategoryNames(): array
    {
        return Category::pluck('name')->toArray();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => ['required', 'string', Rule::in($this->getCategoryNames())],
            'condition' => ['required', Rule::in(['new', 'like_new', 'used'])],
            'photos' => 'nullable|array|min:1',
            'photos.*' => 'string|max:2048',
            'looking_for' => 'required|string|max:255',
            'city' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $item = Item::create([
            ...$data,
            'user_id' => $user->id,
            'city' => $data['city'] ?? $user->city,
            'status' => 'active',
        ]);

        return response()->json(['item' => $item], 201);
    }

    public function feed(Request $request)
    {
        $user = $request->user();
        $blockedIds = $this->blockedUserIds($user);

        $query = Item::with('user')
            ->where('status', 'active')
            ->where('user_id', '!=', $user->id)
            ->whereNotIn('user_id', $blockedIds)
            ->latest();

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
                // No city parameter provided, use user's city as default
                if ($user->city) {
                    $userCity = trim($user->city);
                    $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$userCity]);
                } else {
                    // If user has no city, only show items with no city or empty city
                    $query->where(function ($q) {
                        $q->whereNull('city')
                          ->orWhere('city', '');
                    });
                }
            }
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        $items = $query->get();

        // Calculate distance for each item if current user has location
        if ($user->hasLocation()) {
            $items = $items->map(function ($item) use ($user) {
                // Check if item owner has location
                if ($item->user && $item->user->hasLocation()) {
                    $distanceKm = $this->locationService->calculateDistance(
                        $user->latitude,
                        $user->longitude,
                        $item->user->latitude,
                        $item->user->longitude,
                        'km'
                    );
                    $distanceMiles = $this->locationService->kmToMiles($distanceKm);
                    
                    // Add distance to item
                    $item->distance_km = round($distanceKm, 1);
                    $item->distance_miles = round($distanceMiles, 1);
                } else {
                    // Owner doesn't have location
                    $item->distance_km = null;
                    $item->distance_miles = null;
                }
                
                return $item;
            });
        } else {
            // Current user doesn't have location, set distance to null
            $items = $items->map(function ($item) {
                $item->distance_km = null;
                $item->distance_miles = null;
                return $item;
            });
        }

        return response()->json(['items' => $items]);
    }

    public function show(Request $request, Item $item)
    {
        if ($this->isBlockedBetween($request->user(), $item->user_id)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $item->load('user');
        
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
            'category' => ['sometimes', 'string', Rule::in($this->getCategoryNames())],
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
}
