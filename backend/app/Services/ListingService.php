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
        protected LocationService $locationService,
        protected OneSignalService $oneSignalService
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

        // Notify followers of the new drop
        try {
            $this->oneSignalService->sendNewListingNotification($listing);
        } catch (\Exception $e) {
            \Log::error('Follower notification failed for listing ' . $listing->id . ': ' . $e->getMessage());
        }

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
        
        // Sort by newest first (created_at DESC) - this ensures new listings are at the top
        $query->orderBy('created_at', 'desc');

        // City filtering
        // Only apply city filter if ignore_city is not true
        $ignoreCity = $filters['ignore_city'] ?? false;
        \Log::info('ListingService: City filter', [
            'ignore_city' => $ignoreCity,
            'city_filter' => $filters['city'] ?? null,
            'user_city' => $user ? ($user->city ?? 'none') : 'no_user'
        ]);
        
        if (!$ignoreCity) {
            if (isset($filters['city']) && $filters['city'] !== null && $filters['city'] !== '') {
                $filterCity = trim((string) $filters['city']);
                
                // If city is 'all', don't filter by city
                if (strtolower($filterCity) !== 'all') {
                    // Filter by listing's city field (case-insensitive)
                    // Listings store city name directly (e.g., "Abuja", "Lagos")
                    // Match against the city field in listings table
                    \Log::info('ListingService: Applying city filter', ['city' => $filterCity]);
                    $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$filterCity]);
                } else {
                    \Log::info('ListingService: City filter is "all", skipping city filter');
                }
            } else {
                // If no city filter provided and user has a city, filter by user's city
                // Only in production environment (not local)
                if (config('app.env') !== 'local' && $user) {
                    // Get user's city name from cityLocation relationship or city field
                    $userCity = null;
                    if ($user->relationLoaded('cityLocation') && $user->cityLocation && $user->cityLocation->name) {
                        $userCity = trim($user->cityLocation->name);
                    } elseif ($user->city) {
                        $userCity = trim($user->city);
                    }
                    
                    if ($userCity) {
                        $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$userCity]);
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
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();
        }

        // Get user's liked listings categories for personalization
        $userLikedCategories = [];
        if ($user) {
            // Get categories from listings the user has liked (swiped right or up)
            $likedSwipes = \App\Models\Swipe::where('from_user_id', $user->id)
                ->whereIn('direction', ['right', 'up'])
                ->with('targetListing.category')
                ->get();
            
            // Count category preferences
            $categoryCounts = [];
            foreach ($likedSwipes as $swipe) {
                if ($swipe->targetListing && $swipe->targetListing->category_id) {
                    $catId = $swipe->targetListing->category_id;
                    $categoryCounts[$catId] = ($categoryCounts[$catId] ?? 0) + 1;
                }
            }
            
            // Get top preferred categories (categories user has liked most)
            arsort($categoryCounts);
            $userLikedCategories = array_keys(array_slice($categoryCounts, 0, 5, true)); // Top 5 categories
        }

        // Calculate distances and apply personalized ranking
        // Priority: Use item coordinates > seller's user coordinates
        $userLat = $user ? $user->latitude : session('guest_latitude');
        $userLon = $user ? $user->longitude : session('guest_longitude');

        if ($userLat && $userLon) {
            $maxDistanceKm = 100; // Default 100km radius, can be made configurable
            
            $listings = $listings->map(function ($listing) use ($userLat, $userLon, $userLikedCategories) {
                $distanceKm = null;
                
                // If listing has no coordinates, try to resolve from city/area using Geocoder
                if (!$listing->latitude || !$listing->longitude) {
                    $locationString = $listing->city;
                    if ($listing->user && $listing->user->areaLocation) {
                        $locationString = $listing->user->areaLocation->name . ', ' . $locationString;
                    }
                    
                    if ($locationString) {
                        $resolvedCoords = $this->locationService->getCoordinates($locationString);
                        if ($resolvedCoords) {
                            $listing->latitude = $resolvedCoords['latitude'];
                            $listing->longitude = $resolvedCoords['longitude'];
                            $listing->save(); // Cache it
                        }
                    }
                }

                // Priority 1: Use item's own coordinates if available
                if ($listing->latitude && $listing->longitude) {
                    try {
                        $distanceKm = $this->locationService->calculateDistance(
                            (float) $userLat,
                            (float) $userLon,
                            (float) $listing->latitude,
                            (float) $listing->longitude,
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
                            (float) $userLat,
                            (float) $userLon,
                            (float) $listing->user->latitude,
                            (float) $listing->user->longitude,
                            'km'
                        );
                    } catch (\Exception $e) {
                        \Log::warning('Distance calculation failed for listing ' . $listing->id . ' using seller coordinates: ' . $e->getMessage());
                    }
                }
                
                $listing->distance_km = $distanceKm;
                
                // Calculate personalized score
                $recencyScore = $listing->created_at->timestamp;
                $distanceScore = $distanceKm !== null ? (1000 / max($distanceKm, 0.1)) : 0; 
                $categoryScore = 0;
                if (!empty($userLikedCategories) && $listing->category_id && in_array($listing->category_id, $userLikedCategories)) {
                    // Boost listings from preferred categories
                    $categoryScore = 500; // Significant boost for preferred categories
                }
                
                // Combined score: recency (most important) + distance + category preference
                // We use negative recency to sort descending (newest first), then add distance and category boosts
                $listing->personalized_score = $recencyScore + $distanceScore + $categoryScore;
                
                return $listing;
            })
            // Filter out listings beyond max distance (keep null distances for now)
            ->filter(function ($listing) use ($maxDistanceKm) {
                return $listing->distance_km === null || $listing->distance_km <= $maxDistanceKm;
            })
            // Sort by personalized score (highest first) - this prioritizes:
            // 1. Newest listings (recency score)
            // 2. Closer listings (distance score)
            // 3. Preferred categories (category score)
            ->sortByDesc('personalized_score')
            ->values();
        } else {
            // If user doesn't have location, still apply category-based personalization
            if (!empty($userLikedCategories)) {
                $listings = $listings->map(function ($listing) use ($userLikedCategories) {
                    $recencyScore = $listing->created_at->timestamp;
                    $categoryScore = 0;
                    if ($listing->category_id && in_array($listing->category_id, $userLikedCategories)) {
                        $categoryScore = 500; // Boost for preferred categories
                    }
                    $listing->personalized_score = $recencyScore + $categoryScore;
                    return $listing;
                })
                ->sortByDesc('personalized_score')
                ->values();
            } else {
                // No personalization, just ensure newest first
                $listings = $listings->sortByDesc('created_at')->values();
            }
        }

        return $listings;
    }

    /**
     * Track a view for a listing
     */
    public function trackView(Listing $listing, ?User $user, string $ipAddress, string $userAgent): array
    {
        if (!$listing->id) {
            return [
                'success' => false,
                'message' => 'Invalid listing ID',
                'newly_created' => false,
            ];
        }
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
        if (!$listing->id) {
            return [
                'success' => false,
                'message' => 'Invalid listing ID',
                'newly_created' => false,
            ];
        }
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

