<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Spatie\Geocoder\Facades\Geocoder;
use Illuminate\Http\Request;

/**
 * LocationService
 * 
 * Handles location-based operations including:
 * - Distance calculations using Haversine formula
 * - Geocoding (resolving addresses to coordinates)
 * - Finding nearby users
 * - Validating GPS coordinates
 * - Converting between different distance units
 */
class LocationService
{
    /**
     * Get user coordinates from the request (Auth, Session, or Headers)
     * 
     * @param Request $request
     * @return array|null ['latitude' => float, 'longitude' => float]
     */
    public function getRequestCoordinates(Request $request): ?array
    {
        $user = $request->user();
        
        // 1. Authenticated user
        if ($user) {
            // Priority 1: User's actual GPS coordinates
            if ($user->hasLocation()) {
                return [
                    'latitude' => (float) $user->latitude,
                    'longitude' => (float) $user->longitude
                ];
            }

            // Priority 2: Fall back to user's selected area/city center coordinates
            // Ensure relationships are loaded if possible
            if ($user->area_id || $user->city_id) {
                $user->loadMissing(['areaLocation', 'cityLocation']);
                
                if ($user->area_id && $user->areaLocation && $user->areaLocation->latitude && $user->areaLocation->longitude) {
                    return [
                        'latitude' => (float) $user->areaLocation->latitude,
                        'longitude' => (float) $user->areaLocation->longitude
                    ];
                }
                
                if ($user->city_id && $user->cityLocation && $user->cityLocation->latitude && $user->cityLocation->longitude) {
                    return [
                        'latitude' => (float) $user->cityLocation->latitude,
                        'longitude' => (float) $user->cityLocation->longitude
                    ];
                }
            }
        }

        // 2. Custom headers (from Frontend)
        $lat = $request->header('X-User-Latitude');
        $lng = $request->header('X-User-Longitude');
        
        if ($lat && $lng) {
            return [
                'latitude' => (float) $lat,
                'longitude' => (float) $lng
            ];
        }

        // 3. Session (Guest) - Only check if session is available
        if ($request->hasSession()) {
            $session = $request->session();
            if ($session->has('guest_latitude') && $session->has('guest_longitude')) {
                return [
                    'latitude' => (float) $session->get('guest_latitude'),
                    'longitude' => (float) $session->get('guest_longitude')
                ];
            }
        }

        return null;
    }

    /**
     * Earth's radius in kilometers
     */
    const EARTH_RADIUS_KM = 6371;

    /**
     * Earth's radius in miles
     */
    const EARTH_RADIUS_MILES = 3959;

    /**
     * Calculate distance between two coordinates using Haversine formula
     * 
     * @param float $lat1 Latitude of first point
     * @param float $lon1 Longitude of first point
     * @param float $lat2 Latitude of second point
     * @param float $lon2 Longitude of second point
     * @param string $unit 'km' for kilometers, 'miles' for miles
     * @return float Distance in specified unit
     */
    public function calculateDistance(
        float $lat1,
        float $lon1,
        float $lat2,
        float $lon2,
        string $unit = 'km'
    ): float {
        // Validate coordinates
        if (!$this->isValidCoordinate($lat1, $lon1) || !$this->isValidCoordinate($lat2, $lon2)) {
            throw new \InvalidArgumentException('Invalid coordinates provided');
        }

        // Convert latitude and longitude from degrees to radians
        $lat1Rad = deg2rad($lat1);
        $lon1Rad = deg2rad($lon1);
        $lat2Rad = deg2rad($lat2);
        $lon2Rad = deg2rad($lon2);

        // Calculate differences
        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLon = $lon2Rad - $lon1Rad;

        // Haversine formula
        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLon / 2) * sin($deltaLon / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        // Calculate distance
        $radius = $unit === 'miles' ? self::EARTH_RADIUS_MILES : self::EARTH_RADIUS_KM;
        $distance = $radius * $c;

        // For very small distances (< 0.01km = 10m), keep more precision
        // Otherwise round to 2 decimal places
        if ($distance < 0.01) {
            return round($distance, 4); // Keep 4 decimals for distances < 10m (0.0001km = 0.1m precision)
        }
        
        return round($distance, 2); // Round to 2 decimal places for larger distances
    }

    /**
     * Resolve coordinates for a given address/location string
     * 
     * @param string $address
     * @return array|null ['lat' => float, 'lng' => float]
     */
    public function getCoordinates(string $address): ?array
    {
        try {
            $result = Geocoder::getCoordinatesForAddress($address);
            
            if ($result && isset($result['lat']) && isset($result['lng'])) {
                return [
                    'latitude' => $result['lat'],
                    'longitude' => $result['lng']
                ];
            }
        } catch (\Exception $e) {
            \Log::error("Geocoding failed for address '{$address}': " . $e->getMessage());
        }

        return null;
    }

    /**
     * Find users within a radius from given coordinates
     * 
     * @param float $latitude Center point latitude
     * @param float $longitude Center point longitude
     * @param float $radiusKm Radius in kilometers
     * @param array $excludeUserIds User IDs to exclude from results
     * @param int $limit Maximum number of results
     * @return Collection Collection of users with distance attribute
     */
    public function findNearbyUsers(
        float $latitude,
        float $longitude,
        float $radiusKm = 100.0,
        array $excludeUserIds = [],
        int $limit = 50
    ): Collection {
        // Validate coordinates
        if (!$this->isValidCoordinate($latitude, $longitude)) {
            throw new \InvalidArgumentException('Invalid coordinates provided');
        }

        $query = User::withLocation()
            ->withinRadius($latitude, $longitude, $radiusKm);

        if (!empty($excludeUserIds)) {
            $query->excludeUsers($excludeUserIds);
        }

        return $query->limit($limit)->get();
    }

    /**
     * Validate GPS coordinates
     * 
     * @param float $latitude Latitude to validate (-90 to 90)
     * @param float $longitude Longitude to validate (-180 to 180)
     * @return bool True if valid, false otherwise
     */
    public function isValidCoordinate(float $latitude, float $longitude): bool
    {
        return $latitude >= -90 && $latitude <= 90 &&
               $longitude >= -180 && $longitude <= 180;
    }

    /**
     * Validate and normalize coordinates
     * Throws exception if invalid
     * 
     * @param float $latitude
     * @param float $longitude
     * @return array ['latitude' => float, 'longitude' => float]
     * @throws \InvalidArgumentException
     */
    public function validateAndNormalize(float $latitude, float $longitude): array
    {
        if (!$this->isValidCoordinate($latitude, $longitude)) {
            throw new \InvalidArgumentException(
                'Invalid coordinates. Latitude must be between -90 and 90, ' .
                'longitude must be between -180 and 180.'
            );
        }

        return [
            'latitude' => round($latitude, 7), // Match DECIMAL(10,7) precision
            'longitude' => round($longitude, 7),
        ];
    }

    /**
     * Get bounding box coordinates for a given center point and radius
     * Useful for pre-filtering before applying Haversine formula
     * 
     * @param float $latitude Center latitude
     * @param float $longitude Center longitude
     * @param float $radiusKm Radius in kilometers
     * @return array ['min_lat', 'max_lat', 'min_lon', 'max_lon']
     */
    public function getBoundingBox(float $latitude, float $longitude, float $radiusKm): array
    {
        // Approximate degrees per kilometer at the equator
        // More accurate would use the actual latitude, but this is a good approximation
        $latPerKm = 1 / 111.0; // ~111 km per degree of latitude
        $lonPerKm = 1 / (111.0 * cos(deg2rad($latitude)));

        $latDelta = $radiusKm * $latPerKm;
        $lonDelta = $radiusKm * $lonPerKm;

        return [
            'min_lat' => $latitude - $latDelta,
            'max_lat' => $latitude + $latDelta,
            'min_lon' => $longitude - $lonDelta,
            'max_lon' => $longitude + $lonDelta,
        ];
    }

    /**
     * Convert kilometers to miles
     * 
     * @param float $km
     * @return float
     */
    public function kmToMiles(float $km): float
    {
        return round($km * 0.621371, 2);
    }

    /**
     * Convert miles to kilometers
     * 
     * @param float $miles
     * @return float
     */
    public function milesToKm(float $miles): float
    {
        return round($miles * 1.60934, 2);
    }
}
