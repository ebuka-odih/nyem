<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $distanceKm = $this->calculateDistance($user);
        
        // Get photos array - default to empty array if null
        $photos = $this->photos ?? [];
        $primaryImage = !empty($photos) ? $photos[0] : 'https://via.placeholder.com/800';
        
        // Format price for marketplace listings (with commas)
        $price = null;
        if ($this->type === \App\Models\Listing::TYPE_MARKETPLACE && $this->price) {
            $price = number_format($this->price, 0, '.', ',');
        }
        
        // Calculate listing stats
        $views = $this->views()->count();
        $likes = $this->likes()->count();
        $shares = $this->shares()->count();
        
        // Format distance for display
        $distanceDisplay = $distanceKm !== null 
            ? ($distanceKm < 1 ? round($distanceKm * 1000) . 'm' : $distanceKm . 'km')
            : 'Unknown';
        
        // Safety check for user relationship (should always be loaded via eager loading)
        if (!$this->user) {
            \Log::warning('Listing #' . $this->id . ' is missing user relationship');
            // Return minimal data if user is missing (shouldn't happen in normal operation)
            return [
                'id' => $this->id,
                'type' => $this->type ?? \App\Models\Listing::TYPE_BARTER,
                'title' => $this->title,
                'condition' => ucfirst(str_replace('_', ' ', $this->condition)),
                'image' => $primaryImage,
                'images' => $photos,
                'description' => $this->description ?? '',
                'gallery' => $photos,
                'error' => 'User relationship missing',
            ];
        }
        
        return [
            'id' => $this->id,
            'type' => $this->type ?? \App\Models\Listing::TYPE_BARTER,
            'title' => $this->title,
            'condition' => ucfirst(str_replace('_', ' ', $this->condition)),
            'image' => $primaryImage,
            'images' => $photos,
            'description' => $this->description ?? '',
            'gallery' => $photos,
            'distance' => $distanceKm,
            'distance_km' => $distanceKm,
            'distance_display' => $distanceDisplay,
            'user' => [
                'id' => $this->user->id,
                'username' => $this->user->username,
                'profile_photo' => $this->user->profile_photo ?? null,
                'city' => ($this->user->cityLocation && $this->user->cityLocation->name) ? $this->user->cityLocation->name : ($this->user->city ?? $this->user->location ?? 'Unknown'),
                'area' => ($this->user->areaLocation && $this->user->areaLocation->name) ? $this->user->areaLocation->name : null,
                'city_id' => $this->user->city_id,
                'area_id' => $this->user->area_id,
                'phone_verified_at' => $this->user->phone_verified_at?->toIso8601String() ?? null,
            ],
            'owner' => [
                'id' => $this->user->id,
                'name' => $this->user->username,
                'image' => $this->user->profile_photo ?? null,
                'location' => $this->formatUserLocation(),
                'distance' => $distanceDisplay,
                'phone_verified_at' => $this->user->phone_verified_at?->toIso8601String() ?? null,
            ],
            // Type-specific fields
            'price' => $this->type === \App\Models\Listing::TYPE_MARKETPLACE ? $price : null,
            'looking_for' => $this->type !== \App\Models\Listing::TYPE_MARKETPLACE ? ($this->looking_for ?? '') : null,
            'lookingFor' => $this->type !== \App\Models\Listing::TYPE_MARKETPLACE ? ($this->looking_for ?? '') : null,
            // Additional fields
            'category' => ($this->category && $this->category->name) ? $this->category->name : null,
            'category_id' => $this->category_id,
            'city' => $this->city,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Stats
            'views' => $views,
            'likes' => $likes,
            'shares' => $shares,
        ];
    }

    /**
     * Calculate distance between current user and listing owner
     */
    private function calculateDistance($user): ?float
    {
        if (!$user || !$user->hasLocation() || !$this->user || !$this->user->hasLocation()) {
            return null;
        }

        // Use pre-calculated distance if available
        if (isset($this->distance_km)) {
            $distanceKm = $this->distance_km;
        } else {
            // Calculate distance using LocationService
            try {
                $locationService = app(\App\Services\LocationService::class);
                $distanceKm = $locationService->calculateDistance(
                    $user->latitude,
                    $user->longitude,
                    $this->user->latitude,
                    $this->user->longitude,
                    'km'
                );
            } catch (\Exception $e) {
                \Log::warning('Resource distance calculation failed: ' . $e->getMessage());
                $distanceKm = null;
            }
        }
        
        // Format distance based on size
        if ($distanceKm < 0.001) {
            return $distanceKm; // Keep full precision
        } elseif ($distanceKm < 0.1) {
            return round($distanceKm, 4);
        } elseif ($distanceKm < 1) {
            return round($distanceKm, 2);
        } else {
            return round($distanceKm, 1);
        }
    }

    /**
     * Format user location as "City, Area" or just "City"
     */
    private function formatUserLocation(): string
    {
        $city = ($this->user->cityLocation && $this->user->cityLocation->name) 
            ? $this->user->cityLocation->name 
            : ($this->user->city ?? $this->user->location ?? 'Unknown');
        $area = ($this->user->areaLocation && $this->user->areaLocation->name) 
            ? $this->user->areaLocation->name 
            : null;
        
        if ($area) {
            return "{$city}, {$area}";
        }
        
        return $city;
    }
}


