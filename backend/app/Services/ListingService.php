<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Listing;
use App\Models\ListingStat;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

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

        $listing = Listing::create([
            ...$data,
            'type' => $type,
            'user_id' => $user->id,
            'city' => $data['city'] ?? $user->city,
            'status' => Listing::STATUS_ACTIVE,
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
                if (strtolower($filterCity) !== 'all') {
                    $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$filterCity]);
                }
            } else {
                // If no city filter provided and user has a city, filter by user's city
                // Only in production environment (not local)
                if (config('app.env') !== 'local' && $user && $user->city) {
                    $userCity = trim($user->city);
                    $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = LOWER(?)', [$userCity]);
                }
            }
        }

        // Filter by category
        if (isset($filters['category']) && $filters['category'] !== null) {
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
        if (isset($filters['type']) && $filters['type'] !== null) {
            $type = $filters['type'];
            if (in_array($type, Listing::getTypeOptions())) {
                $query->where('type', $type);
            }
        }

        $listings = $query->get();

        // Calculate distances and sort if user has location
        if ($user && $user->hasLocation()) {
            $listings = $listings->map(function ($listing) use ($user) {
                if ($listing->user && $listing->user->hasLocation()) {
                    $distanceKm = $this->locationService->calculateDistance(
                        $user->latitude,
                        $user->longitude,
                        $listing->user->latitude,
                        $listing->user->longitude,
                        'km'
                    );
                    $listing->distance_km = $distanceKm;
                } else {
                    $listing->distance_km = null;
                }
                return $listing;
            })->sortBy(function ($listing) {
                return $listing->distance_km ?? PHP_FLOAT_MAX;
            })->values();
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

