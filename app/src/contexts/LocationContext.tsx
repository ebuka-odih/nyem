/**
 * LocationContext
 * 
 * Automatically manages user location:
 * - Requests location permission when user logs in
 * - Updates location on backend
 * - Handles permission denial gracefully
 * - Provides location status and fallback options
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Platform, Alert, AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import {
    getCurrentLocation,
    updateLocationOnBackend,
    watchPosition,
    stopWatchingPosition,
    hasLocationPermission,
    requestLocationPermission,
    getLocationStatus,
} from '../utils/location';

type LocationContextType = {
    locationPermission: 'granted' | 'denied' | 'unavailable' | 'checking';
    isUpdatingLocation: boolean;
    lastLocation: { latitude: number; longitude: number } | null;
    locationError: string | null;
    requestLocation: () => Promise<boolean>;
    updateLocation: () => Promise<void>;
    hasBackendLocation: boolean;
    locationAgeHours: number | null;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'unavailable' | 'checking'>('checking');
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
    const [lastLocation, setLastLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [hasBackendLocation, setHasBackendLocation] = useState(false);
    const [locationAgeHours, setLocationAgeHours] = useState<number | null>(null);
    
    const watchIdRef = useRef<number | (() => void) | null>(null);
    const isInitialRequestRef = useRef(false);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // Check location permission status
    const checkPermissionStatus = useCallback(async () => {
        try {
            const hasPermission = await hasLocationPermission();
            if (Platform.OS === 'web' && navigator.geolocation) {
                // For web, we assume it's available if geolocation exists
                // Actual permission will be checked when getting location
                setLocationPermission('granted');
            } else if (hasPermission) {
                setLocationPermission('granted');
            } else {
                setLocationPermission('denied');
            }
        } catch (error) {
            setLocationPermission('unavailable');
        }
    }, []);

    // Check backend location status
    const checkBackendLocationStatus = useCallback(async () => {
        if (!token) {
            setHasBackendLocation(false);
            setLocationAgeHours(null);
            return;
        }

        try {
            const response = await getLocationStatus(token);
            const status = response.data;
            setHasBackendLocation(status.has_location);
            setLocationAgeHours(status.location_age_hours);
        } catch (error) {
            console.error('Failed to check backend location status:', error);
        }
    }, [token]);

    // Request location permission and get current location
    const requestLocation = useCallback(async (): Promise<boolean> => {
        if (!token) {
            setLocationError('Authentication required');
            return false;
        }

        setLocationError(null);
        setLocationPermission('checking');

        try {
            // Request permission
            const hasPermission = await requestLocationPermission();
            
            if (!hasPermission) {
                setLocationPermission('denied');
                setLocationError('Location permission denied. Please enable location access in your device settings.');
                
                // Show helpful alert
                Alert.alert(
                    'Location Permission Required',
                    'To find nearby users and items, we need your location. You can enable it in your device settings, or you can continue using the app with limited features.',
                    [
                        {
                            text: 'Continue Without Location',
                            style: 'cancel',
                        },
                    ]
                );
                return false;
            }

            setLocationPermission('granted');
            
            // Get current location
            const location = await getCurrentLocation({
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            });

            setLastLocation({
                latitude: location.latitude,
                longitude: location.longitude,
            });

            // Update on backend
            await updateLocationOnBackend(location.latitude, location.longitude, token);
            await checkBackendLocationStatus();

            return true;
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to get location';
            setLocationError(errorMessage);
            setLocationPermission('denied');
            
            // Show user-friendly error
            Alert.alert(
                'Location Error',
                errorMessage + '\n\nYou can continue using the app, but some features may be limited.',
                [{ text: 'OK' }]
            );
            
            return false;
        }
    }, [token, checkBackendLocationStatus]);

    // Update location manually
    const updateLocation = useCallback(async () => {
        if (!token) return;
        
        setIsUpdatingLocation(true);
        setLocationError(null);

        try {
            const location = await getCurrentLocation({
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            });

            await updateLocationOnBackend(location.latitude, location.longitude, token);
            setLastLocation({
                latitude: location.latitude,
                longitude: location.longitude,
            });
            
            await checkBackendLocationStatus();
        } catch (error: any) {
            setLocationError(error.message || 'Failed to update location');
            throw error;
        } finally {
            setIsUpdatingLocation(false);
        }
    }, [token, checkBackendLocationStatus]);

    // Start watching position (for active users)
    const startWatching = useCallback(() => {
        if (!token || locationPermission !== 'granted') return;

        // Stop existing watch if any
        if (watchIdRef.current) {
            if (typeof watchIdRef.current === 'number') {
                stopWatchingPosition(watchIdRef.current);
            } else if (typeof watchIdRef.current === 'function') {
                watchIdRef.current();
            }
        }

        // Start watching with throttling (update every 30 seconds minimum)
        const lastUpdateRef = { current: 0 };

        try {
            const watchId = watchPosition(
                async (location) => {
                    const now = Date.now();
                    const timeSinceLastUpdate = now - lastUpdateRef.current;

                    // Throttle updates to backend (every 30 seconds minimum)
                    if (timeSinceLastUpdate >= 30000 && token) {
                        try {
                            await updateLocationOnBackend(
                                location.latitude,
                                location.longitude,
                                token
                            );
                            lastUpdateRef.current = now;
                            setLastLocation({
                                latitude: location.latitude,
                                longitude: location.longitude,
                            });
                        } catch (error) {
                            console.error('Failed to update location during watch:', error);
                        }
                    }
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000, // Use cached location if < 5 seconds old
                }
            );

            watchIdRef.current = watchId;
        } catch (error) {
            console.error('Failed to start watching position:', error);
        }
    }, [token, locationPermission]);

    // Stop watching position
    const stopWatching = useCallback(() => {
        if (watchIdRef.current) {
            if (typeof watchIdRef.current === 'number') {
                stopWatchingPosition(watchIdRef.current);
            } else if (typeof watchIdRef.current === 'function') {
                watchIdRef.current();
            }
            watchIdRef.current = null;
        }
    }, []);

    // Handle app state changes (pause/resume location tracking)
    useEffect(() => {
        if (!token) return;

        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App came to foreground - check if location needs updating
                await checkBackendLocationStatus();
                
                // Check if location needs updating (old or missing)
                const needsUpdate = !hasBackendLocation || (locationAgeHours !== null && locationAgeHours > 1);
                
                if (needsUpdate && locationPermission === 'granted') {
                    updateLocation().catch(() => {
                        // Silent fail - location will be requested next time
                    });
                }
            } else if (
                appStateRef.current === 'active' &&
                nextAppState.match(/inactive|background/)
            ) {
                // App went to background - stop watching to save battery
                stopWatching();
            }

            appStateRef.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [token, locationPermission, checkBackendLocationStatus, updateLocation, stopWatching]);
    
    // Update hasBackendLocation and locationAgeHours when they change
    useEffect(() => {
        // This effect will re-run when the state values change
        // But we don't need to do anything here, just let the state update
    }, [hasBackendLocation, locationAgeHours]);

    // Auto-request location when user logs in (only once)
    useEffect(() => {
        if (!token || !user || isInitialRequestRef.current) return;

        // Mark as requested to prevent multiple requests
        isInitialRequestRef.current = true;

        // Check backend location status first
        checkBackendLocationStatus().then(() => {
            // Small delay to allow UI to render
            const timer = setTimeout(async () => {
                // Check if user already has recent location (< 1 hour old)
                const statusResponse = await getLocationStatus(token).catch(() => null);
                const hasRecentLocation = statusResponse?.data?.has_location && 
                    statusResponse.data.location_age_hours !== null && 
                    statusResponse.data.location_age_hours < 1;

                if (hasRecentLocation) {
                    // User has recent location, just check permission status
                    await checkPermissionStatus();
                    return;
                }

                // Request location
                const success = await requestLocation();
                if (success) {
                    // Start watching position after a delay
                    setTimeout(() => startWatching(), 2000);
                }
            }, 1000);

            return () => clearTimeout(timer);
        });
    }, [token, user]); // Only depend on token and user

    // Reset location state when user logs out
    useEffect(() => {
        if (!token || !user) {
            // User logged out - reset state
            isInitialRequestRef.current = false;
            setLocationPermission('checking');
            setLastLocation(null);
            setLocationError(null);
            setHasBackendLocation(false);
            setLocationAgeHours(null);
            stopWatching();
        }
    }, [token, user, stopWatching]);

    // Check permission status on mount
    useEffect(() => {
        checkPermissionStatus();
        if (token) {
            checkBackendLocationStatus();
        }
    }, [checkPermissionStatus, checkBackendLocationStatus, token]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWatching();
        };
    }, [stopWatching]);

    const value: LocationContextType = {
        locationPermission,
        isUpdatingLocation,
        lastLocation,
        locationError,
        requestLocation,
        updateLocation,
        hasBackendLocation,
        locationAgeHours,
    };

    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within LocationProvider');
    }
    return context;
}
