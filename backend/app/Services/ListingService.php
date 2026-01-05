<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Listing;
use App\Models\ListingStat;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ListingService
{
    public function __construct(
        protected LocationService $locationService
    ) {}

    /**
     * Create a new listing
     */
    public function createListing(array $data, User $user): Listing
    {
        // Validate type-specific requirements
        $type = $data['type'] ?? Listing::TYPE_BARTER;
        
        if ($type === Listing::TYPE_MARKETPLACE) {
            if (empty($data['price'])) {
                throw new \InvalidArgumentException('Price is required for marketplace listings');
            }
            $data['looking_for'] = null;
        } else {
            if (empty($data['looking_for'])) {
                throw new \InvalidArgumentException('looking_for is required for barter listings');
            }
            $data['price'] = null;
        }

        // Check phone verification requirement
        $listingsCount = $user->listings()->count();
        $freeUploadLimit = 2;
        
        if (!$user->phone_verified_at && $listingsCount >= $freeUploadLimit) {
            throw new \Exception('Verify your account to upload more listings. You can upload up to 2 listings without verification.', 403);
        }

        // Get coordinates from seller's area or city location
        $latitude = null;
        $longitude = null;
        
        // Priority: User's GPS coordinates > Area coordinates > City coordinates
        if ($user->hasLocation()) {
            $latitude = $user->latitude;
            $longitude = $user->longitude;
        } else {
            $user->load(['areaLocation', 'cityLocation']);
            if ($user->area_id && $user->areaLocation && $user->areaLocation->latitude && $user->areaLocation->longitude) {
                $latitude = $user->areaLocation->latitude;
                $longitude = $user->areaLocation->longitude;
            } elseif ($user->city_id && $user->cityLocation && $user->cityLocation->latitude && $user->cityLocation->longitude) {
                $latitude = $user->cityLocation->latitude;
                $longitude = $user->cityLocation->longitude;
            }
        }

        $listing = Listing::create([
            ...$data,
            'type' => $type,
            'user_id' => $user->id,
            'city' => $data['city'] ?? $user->city,
            'status' => Listing::STATUS_ACTIVE,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        $listing->load(['user.cityLocation', 'user.areaLocation']);

        return $listing;
    }

    /**
     * Update an existing listing
     */
    public function updateListing(Listing $listing, array $data): Listing
    {
        $type = $data['type'] ?? $listing->type ?? Listing::TYPE_BARTER;
        
        // If type is being changed, enforce type-specific rules
        if (isset($data['type'])) {
            if ($type === Listing::TYPE_MARKETPLACE) {
                if (isset($data['price']) && empty($data['price'])) {
                    throw new \InvalidArgumentException('Price is required for marketplace listings');
                }
                $data['looking_for'] = null;
            } elseif ($type === Listing::TYPE_BARTER) {
                if (isset($data['looking_for']) && empty($data['looking_for'])) {
                    throw new \InvalidArgumentException('looking_for is required for barter listings');
                }
                $data['price'] = null;
            }
        } else {
            // If type is not being changed, validate based on current type
            if ($type === Listing::TYPE_MARKETPLACE) {
                if (isset($data['price']) && ($data['price'] === null || $data['price'] === '')) {
                    throw new \InvalidArgumentException('Price is required for marketplace listings');
                }
            } elseif ($type === Listing::TYPE_BARTER) {
                if (isset($data['looking_for']) && ($data['looking_for'] === null || $data['looking_for'] === '')) {
                    throw new \InvalidArgumentException('looking_for is required for barter listings');
                }
            }
        }

        $listing->update($data);
        $listing->refresh();

        return $listing;
    }

    /**
     * Get filtered listings for feed
     */
    public function getFeedListings(array $filters, ?User $user = null, array $blockedIds = []): Collection
    {
        $query = Listing::with(['user.cityLocation', 'user.areaLocation', 'category'])
            ->where('status', Listing::STATUS_ACTIVE);
        
        // Exclude blocked users if authenticated
        if ($user) {
            $includeOwn = $filters['include_own'] ?? true;
            if (!$includeOwn) {
                $query->where('user_id', '!=', $user->id);
            }
            if (!empty($blockedIds)) {
                $query->whereNotIn('user_id', $blockedIds);
            }
        }
        
        $query->latest();

        // City filtering
        // Only apply city filter if ignore_city is not true
        if (!($filters['ignore_city'] ?? false)) {
            if (isset($filters['city']) && $filters['city'] !== null) {
                $filterCity = trim((string) $filters['city']);
                
                // If city is 'all', don't filter by city
                if (strtolower($filterCity) !== 'all' && $filterCity !== '') {
                    // Get available columns to avoid SQL errors
                    $tableName = $query->getModel()->getTable();
                    $columns = Schema::getColumnListing($tableName);
                    $query->where(function($q) use ($filterCity, $columns) {
                        if (in_array('city', $columns)) {
                            $q->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$filterCity]);
                        }
                        if (in_array('location', $columns)) {
                            $q->orWhereRaw('LOWER(TRIM(COALESCE(location, ""))) = LOWER(?)', [$filterCity]);
                        }
                    });
                }
            } else {
                // If no city filter provided and user has a city, filter by user's city
                // Only in production environment (not local)
                if (config('app.env') !== 'local' && $user && ($user->city || $user->city_id)) {
                    $userCity = $user->city ? trim($user->city) : null;
                    if ($userCity) {
                        $tableName = $query->getModel()->getTable();
                        $columns = Schema::getColumnListing($tableName);
                        $query->where(function($q) use ($userCity, $columns) {
                            if (in_array('city', $columns)) {
                                $q->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$userCity]);
                            }
                            if (in_array('location', $columns)) {
                                $q->orWhereRaw('LOWER(TRIM(COALESCE(location, ""))) = LOWER(?)', [$userCity]);
                            }
                        });
                    }
                }
            }
        }

        // Filter by category
        if (isset($filters['category']) && $filters['category'] !== null && $filters['category'] !== '' && strtolower($filters['category']) !== 'all') {
            $categoryName = $filters['category'];
            if (is_numeric($categoryName)) {
                $query->where('category_id', $categoryName);
            } else {
                $category = Category::where('name', $categoryName)->first();
                if ($category) {
                    $query->where('category_id', $category->id);
                }
            }
        }

        // Filter by type
        if (isset($filters['type']) && $filters['type'] !== null && $filters['type'] !== '') {
            $type = $filters['type'];
            if (in_array($type, Listing::getTypeOptions())) {
                if ($type === Listing::TYPE_MARKETPLACE) {
                    $query->where(function($q) {
                        $q->where('type', Listing::TYPE_MARKETPLACE)
                          ->orWhere('type', 'shop');
                    });
                } else {
                    $query->where('type', $type);
                }
            }
        }

        // Note: Distance filtering will be done after fetching to avoid complex joins
        // that might break existing functionality. We'll calculate distances in memory.

        try {
            $listings = $query->get();
        } catch (\Exception $e) {
            \Log::error('Listing feed query failed: ' . $e->getMessage());
            // Fallback: try without some filters if it failed
            $listings = Listing::with(['user.cityLocation', 'user.areaLocation', 'category'])
                ->where('status', Listing::STATUS_ACTIVE)
                ->latest()
                ->take(50)
                ->get();
        }

        // Calculate distances and filter by distance if user has location
        // Priority: Use item coordinates > seller's user coordinates
        if ($user && $user->hasLocation()) {
            $maxDistanceKm = 100; // Default 100km radius, can be made configurable
            
            $listings = $listings->map(function ($listing) use ($user) {
                $distanceKm = null;
                
                // Priority 1: Use item's own coordinates if available
                if ($listing->latitude && $listing->longitude) {
                    try {
                        $distanceKm = $this->locationService->calculateDistance(
                            $user->latitude,
                            $user->longitude,
                            $listing->latitude,
                            $listing->longitude,
                            'km'
                        );
                    } catch (\Exception $e) {
                        \Log::warning('Distance calculation failed for listing ' . $listing->id . ' using item coordinates: ' . $e->getMessage());
                    }
                }
                
                // Priority 2: Fall back to seller's user coordinates if item has no coordinates
                if ($distanceKm === null && $listing->user && $listing->user->hasLocation()) {
                    try {
                        $distanceKm = $this->locationService->calculateDistance(
                            $user->latitude,
                            $user->longitude,
                            $listing->user->latitude,
                            $listing->user->longitude,
                            'km'
                        );
                    } catch (\Exception $e) {
                        \Log::warning('Distance calculation failed for listing ' . $listing->id . ' using seller coordinates: ' . $e->getMessage());
                    }
                }
                
                $listing->distance_km = $distanceKm;
                return $listing;
            })
            // Filter out listings beyond max distance (keep null distances for now)
            ->filter(function ($listing) use ($maxDistanceKm) {
                return $listing->distance_km === null || $listing->distance_km <= $maxDistanceKm;
            })
            // Sort by distance (closest first), then by created_at (newest first)
            ->sortBy(function ($listing) {
                return [$listing->distance_km ?? 999999, -$listing->created_at->timestamp];
            })
            ->values();
        }

        return $listings;
    }

    /**
     * Track a view for a listing
     */
    public function trackView(Listing $listing, ?User $user, string $ipAddress, string $userAgent): array
    {
        // Check for existing view within last 24 hours
        $existingView = ListingStat::where('listing_id', $listing->id)
            ->where('type', 'view')
            ->where(function ($query) use ($user, $ipAddress) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->whereNull('user_id')
                        ->where('ip_address', $ipAddress);
                }
            })
            ->where('created_at', '>=', now()->subDay())
            ->first();

        if ($existingView) {
            return [
                'success' => true,
                'message' => 'View already tracked',
                'view_count' => $listing->views()->count(),
                'newly_created' => false,
            ];
        }

        // Create new view record
        ListingStat::create([
            'listing_id' => $listing->id,
            'user_id' => $user?->id,
            'type' => 'view',
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);

        return [
            'success' => true,
            'message' => 'View tracked successfully',
            'view_count' => $listing->views()->count(),
            'newly_created' => true,
        ];
    }

    /**
     * Track a share for a listing
     */
    public function trackShare(Listing $listing, ?User $user, string $ipAddress, string $userAgent): array
    {
        // Check for existing share within last 24 hours
        $existingShare = ListingStat::where('listing_id', $listing->id)
            ->where('type', 'share')
            ->where(function ($query) use ($user, $ipAddress) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->whereNull('user_id')
                        ->where('ip_address', $ipAddress);
                }
            })
            ->where('created_at', '>=', now()->subDay())
            ->first();

        if ($existingShare) {
            return [
                'success' => true,
                'message' => 'Share already tracked',
                'share_count' => $listing->shares()->count(),
                'newly_created' => false,
            ];
        }

        // Create new share record
        ListingStat::create([
            'listing_id' => $listing->id,
            'user_id' => $user?->id,
            'type' => 'share',
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);

        return [
            'success' => true,
            'message' => 'Share tracked successfully',
            'share_count' => $listing->shares()->count(),
            'newly_created' => true,
        ];
    }

    /**
     * Calculate and attach distance to listing
     */
    public function attachDistance(Listing $listing, ?User $user): void
    {
        if ($user && $user->hasLocation() && $listing->user && $listing->user->hasLocation()) {
            $distanceKm = $this->locationService->calculateDistance(
                $user->latitude,
                $user->longitude,
                $listing->user->latitude,
                $listing->user->longitude,
                'km'
            );
            $distanceMiles = $this->locationService->kmToMiles($distanceKm);
            
            $listing->distance_km = round($distanceKm, 1);
            $listing->distance_miles = round($distanceMiles, 1);
        } else {
            $listing->distance_km = null;
            $listing->distance_miles = null;
        }
    }
}

