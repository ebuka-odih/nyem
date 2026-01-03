/**
 * Location Utility for Web
 * 
 * Provides location services using browser geolocation API:
 * - Get current location with user permission
 * - Update location on the backend
 * - Handle permission requests gracefully
 */

import { apiFetch } from './api';
import { ENDPOINTS } from '../constants/endpoints';

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
 * Get current location using browser geolocation API
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

    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

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
        await apiFetch(ENDPOINTS.location.update, {
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
 * Request location permission
 * For web, permissions are requested automatically when getting location
 * This is a placeholder that checks if geolocation is available
 * 
 * @returns Promise<boolean> True if geolocation is available
 */
export async function requestLocationPermission(): Promise<boolean> {
    // Browser permissions are requested automatically on getCurrentLocation
    // This function just checks if geolocation is available
    return navigator.geolocation !== undefined;
}

/**
 * Check if location permission is available
 * Note: Browsers don't allow checking permission status without requesting it
 * 
 * @returns Promise<boolean>
 */
export async function hasLocationPermission(): Promise<boolean> {
    // For web, we can't check permission status without requesting
    // Return true if geolocation is available
    return navigator.geolocation !== undefined;
}


















