/**
 * Location Utility
 * 
 * Provides location services for both web and mobile platforms:
 * - Browser geolocation API for web
 * - Expo Location API for React Native
 * - Fallback to IP-based geolocation (optional)
 * 
 * Features:
 * - Get current location with user permission
 * - Watch position for live tracking
 * - Update location on the backend
 * - Handle permission requests gracefully
 */

import { Platform } from 'react-native';
import { apiFetch } from './api';

// Dynamically import expo-location only for mobile platforms
// This prevents errors on web where it's not needed
let Location: any = null;
if (Platform.OS !== 'web') {
    try {
        Location = require('expo-location');
    } catch (error) {
        console.warn('expo-location not installed. Mobile location features will not work.');
    }
}

/**
 * Location coordinates interface
 */
export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
}

/**
 * Location update options
 */
export interface LocationUpdateOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

/**
 * Get current location using browser geolocation API (web) or Expo Location (mobile)
 * 
 * @param options Location options
 * @returns Promise<LocationCoordinates>
 */
export async function getCurrentLocation(
    options: LocationUpdateOptions = {}
): Promise<LocationCoordinates> {
    const {
        enableHighAccuracy = true,
        timeout = 15000, // 15 seconds
        maximumAge = 0, // Don't use cached location
    } = options;

    if (Platform.OS === 'web') {
        return getBrowserLocation(options);
    } else {
        return getExpoLocation(options);
    }
}

/**
 * Get location using browser Geolocation API
 * 
 * @param options Location options
 * @returns Promise<LocationCoordinates>
 */
async function getBrowserLocation(
    options: LocationUpdateOptions = {}
): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        const {
            enableHighAccuracy = true,
            timeout = 15000,
            maximumAge = 0,
        } = options;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy || undefined,
                    timestamp: position.timestamp,
                });
            },
            (error) => {
                let errorMessage = 'Failed to get location';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge,
            }
        );
    });
}

/**
 * Get location using Expo Location API (React Native)
 * 
 * @param options Location options
 * @returns Promise<LocationCoordinates>
 */
async function getExpoLocation(
    options: LocationUpdateOptions = {}
): Promise<LocationCoordinates> {
    if (!Location) {
        throw new Error('expo-location is not installed. Please install it with: npm install expo-location');
    }

    // Request permission first
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
        throw new Error('Location permission denied. Please enable location access in your device settings.');
    }

    const {
        enableHighAccuracy = true,
        timeout = 15000,
        maximumAge = 0,
    } = options;

    try {
        const location = await Location.getCurrentPositionAsync({
            accuracy: enableHighAccuracy 
                ? Location.Accuracy.High 
                : Location.Accuracy.Balanced,
            timeInterval: maximumAge,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
        };
    } catch (error: any) {
        throw new Error(`Failed to get location: ${error.message}`);
    }
}

/**
 * Watch position for live location tracking
 * 
 * @param callback Callback function called when position updates
 * @param options Location options
 * @returns Watch ID that can be used to stop watching
 */
export function watchPosition(
    callback: (location: LocationCoordinates) => void,
    options: LocationUpdateOptions = {}
): number | (() => void) {
    const {
        enableHighAccuracy = true,
        timeout = 15000,
        maximumAge = 0,
    } = options;

    if (Platform.OS === 'web') {
        return watchBrowserPosition(callback, options);
    } else {
        return watchExpoPosition(callback, options);
    }
}

/**
 * Watch position using browser Geolocation API
 * 
 * @param callback Callback function
 * @param options Location options
 * @returns Watch ID
 */
function watchBrowserPosition(
    callback: (location: LocationCoordinates) => void,
    options: LocationUpdateOptions = {}
): number {
    const {
        enableHighAccuracy = true,
        timeout = 15000,
        maximumAge = 0,
    } = options;

    if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy || undefined,
                timestamp: position.timestamp,
            });
        },
        (error) => {
            console.error('Error watching position:', error);
        },
        {
            enableHighAccuracy,
            timeout,
            maximumAge,
        }
    );

    return watchId;
}

/**
 * Watch position using Expo Location API
 * 
 * @param callback Callback function
 * @param options Location options
 * @returns Stop watching function
 */
async function watchExpoPosition(
    callback: (location: LocationCoordinates) => void,
    options: LocationUpdateOptions = {}
): Promise<() => void> {
    if (!Location) {
        throw new Error('expo-location is not installed. Please install it with: npm install expo-location');
    }

    // Request permission first
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
        throw new Error('Location permission denied. Please enable location access in your device settings.');
    }

    const {
        enableHighAccuracy = true,
        maximumAge = 0,
    } = options;

    // Subscribe to location updates
    const subscription = await Location.watchPositionAsync(
        {
            accuracy: enableHighAccuracy 
                ? Location.Accuracy.High 
                : Location.Accuracy.Balanced,
            timeInterval: maximumAge || 1000, // Update every second if not specified
            distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
            callback({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || undefined,
                timestamp: location.timestamp,
            });
        }
    );

    // Return function to stop watching
    return () => {
        subscription.remove();
    };
}

/**
 * Stop watching position (browser only)
 * 
 * @param watchId Watch ID returned from watchPosition
 */
export function stopWatchingPosition(watchId: number): void {
    if (Platform.OS === 'web' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
    }
    // For Expo, the watch function returns a cleanup function that should be called directly
}

/**
 * Update user location on the backend
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param token Authentication token
 * @returns Promise<void>
 */
export async function updateLocationOnBackend(
    latitude: number,
    longitude: number,
    token: string | null
): Promise<void> {
    if (!token) {
        throw new Error('Authentication required to update location');
    }

    try {
        await apiFetch('/location/update', {
            method: 'POST',
            body: {
                latitude,
                longitude,
            },
            token,
        });
    } catch (error: any) {
        console.error('Failed to update location on backend:', error);
        throw new Error(error.message || 'Failed to update location');
    }
}

/**
 * Get nearby users from backend
 * 
 * @param latitude Optional latitude (uses user's location if not provided)
 * @param longitude Optional longitude (uses user's location if not provided)
 * @param radiusKm Search radius in kilometers (default: 50)
 * @param limit Maximum number of results (default: 50)
 * @param token Authentication token
 * @returns Promise with nearby users data
 */
export async function getNearbyUsers(
    token: string | null,
    latitude?: number,
    longitude?: number,
    radiusKm: number = 50,
    limit: number = 50
): Promise<any> {
    if (!token) {
        throw new Error('Authentication required to get nearby users');
    }

    const params: Record<string, string> = {
        radius: radiusKm.toString(),
        limit: limit.toString(),
    };

    if (latitude !== undefined && longitude !== undefined) {
        params.latitude = latitude.toString();
        params.longitude = longitude.toString();
    }

    const queryString = new URLSearchParams(params).toString();

    try {
        return await apiFetch(`/location/nearby?${queryString}`, {
            method: 'GET',
            token,
        });
    } catch (error: any) {
        console.error('Failed to get nearby users:', error);
        throw new Error(error.message || 'Failed to get nearby users');
    }
}

/**
 * Get location status from backend
 * 
 * @param token Authentication token
 * @returns Promise with location status
 */
export async function getLocationStatus(token: string | null): Promise<any> {
    if (!token) {
        throw new Error('Authentication required to get location status');
    }

    try {
        return await apiFetch('/location/status', {
            method: 'GET',
            token,
        });
    } catch (error: any) {
        console.error('Failed to get location status:', error);
        throw new Error(error.message || 'Failed to get location status');
    }
}

/**
 * Request location permission
 * 
 * @returns Promise<boolean> True if permission granted
 */
export async function requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
        // Browser permissions are requested automatically on getCurrentLocation
        // This is a placeholder for web
        return navigator.geolocation !== undefined;
    } else {
        if (!Location) {
            throw new Error('expo-location is not installed. Please install it with: npm install expo-location');
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    }
}

/**
 * Check if location permission is granted
 * 
 * @returns Promise<boolean>
 */
export async function hasLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
        // For web, we can't check permission status without requesting
        // Return true if geolocation is available
        return navigator.geolocation !== undefined;
    } else {
        if (!Location) {
            return false;
        }
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    }
}

/**
 * Format distance for display
 * 
 * @param distanceKm Distance in kilometers
 * @param unit 'km' or 'miles'
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number, unit: 'km' | 'miles' = 'km'): string {
    const distance = unit === 'miles' ? distanceKm * 0.621371 : distanceKm;
    
    if (distance < 1) {
        const meters = distance * 1000;
        return `${Math.round(meters)}m`;
    } else if (distance < 10) {
        return `${distance.toFixed(1)}${unit === 'miles' ? 'mi' : 'km'}`;
    } else {
        return `${Math.round(distance)}${unit === 'miles' ? 'mi' : 'km'}`;
    }
}
