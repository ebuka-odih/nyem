import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ApiUser } from '../types';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { getCurrentLocation, updateLocationOnBackend, requestLocationPermission } from '../utils/location';
import { Alert } from 'react-native';

type AuthContextType = {
    user: ApiUser | null;
    token: string | null;
    loading: boolean;
    sendOtp: (phone: string) => Promise<{ debug_code?: string }>;
    sendEmailOtp: (email: string) => Promise<{ debug_code?: string }>;
    verifyOtp: (payload: { phone?: string; email?: string; code: string; name?: string; username?: string; city?: string; password?: string }) => Promise<{ new_user: boolean }>;
    verifyPhoneForSeller: (phone: string, code: string) => Promise<void>;
    login: (payload: { usernameOrPhone: string; password: string }) => Promise<void>;
    register: (payload: { email: string; name: string; password: string }) => Promise<{ requires_verification: boolean; email: string }>;
    refreshUser: () => Promise<void>;
    updateProfile: (data: { username?: string; city?: string; bio?: string; profile_photo?: string; password?: string }) => Promise<void>;
    updatePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<ApiUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const storedToken = await AsyncStorage.getItem('auth_token');
            if (storedToken) {
                setToken(storedToken);
                try {
                    const res = await apiFetch(ENDPOINTS.profile.me, { token: storedToken });
                    setUser(res.user as ApiUser);
                    await AsyncStorage.setItem('auth_user', JSON.stringify(res.user));
                } catch (err) {
                    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
                    setUser(null);
                    setToken(null);
                }
            }
            setLoading(false);
        })();
    }, []);

    const sendOtp = async (phone: string) => {
        const res = await apiFetch(ENDPOINTS.auth.sendOtp, {
            method: 'POST',
            body: { phone },
        });
        return { debug_code: res.debug_code as string | undefined };
    };

    const sendEmailOtp = async (email: string) => {
        const res = await apiFetch(ENDPOINTS.auth.sendEmailOtp, {
            method: 'POST',
            body: { email },
        });
        return { debug_code: res.debug_code as string | undefined };
    };

    const verifyOtp = async (payload: { phone?: string; email?: string; code: string; name?: string; username?: string; city?: string; password?: string }) => {
        const res = await apiFetch(ENDPOINTS.auth.verifyOtp, {
            method: 'POST',
            body: payload,
        });
        const authToken = res.token as string;
        setToken(authToken);
        setUser(res.user as ApiUser);
        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res.user));
        
        // Request location after successful login
        requestUserLocation(authToken);
        
        return { new_user: Boolean(res.new_user) };
    };

    const verifyPhoneForSeller = async (phone: string, code: string) => {
        if (!token) {
            throw new Error('Not authenticated');
        }
        const res = await apiFetch(ENDPOINTS.auth.verifyPhoneForSeller, {
            method: 'POST',
            token,
            body: { phone, code },
        });
        const userData = (res.user || res.data?.user) as ApiUser;
        setUser(userData);
        await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    };

    const login = async ({ usernameOrPhone, password }: { usernameOrPhone: string; password: string }) => {
        const res = await apiFetch(ENDPOINTS.auth.login, {
            method: 'POST',
            body: { username_or_phone: usernameOrPhone, password },
        });
        const authToken = res.token as string;
        setToken(authToken);
        setUser(res.user as ApiUser);
        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res.user));
        
        // Request location after successful login
        requestUserLocation(authToken);
    };

    const register = async ({ email, name, password }: { email: string; name: string; password: string }) => {
        const res = await apiFetch(ENDPOINTS.auth.register, {
            method: 'POST',
            body: { email, name, password },
        });
        
        // Registration now requires email verification
        // User is not created until email is verified
        return {
            requires_verification: res.requires_verification ?? true,
            email: res.email ?? email,
        };
    };

    /**
     * Request user location and update on backend
     * Shows an alert to ask for permission first
     */
    const requestUserLocation = async (authToken: string) => {
        try {
            // Show alert asking for location permission
            Alert.alert(
                'Location Access',
                'To help you find nearby users and items, we need your location. Would you like to share your location?',
                [
                    {
                        text: 'Not Now',
                        style: 'cancel',
                        onPress: () => {
                            console.log('User declined location access');
                        },
                    },
                    {
                        text: 'Allow',
                        onPress: async () => {
                            try {
                                // Request permission
                                const hasPermission = await requestLocationPermission();
                                
                                if (!hasPermission) {
                                    Alert.alert(
                                        'Permission Denied',
                                        'Location permission is required to find nearby users. You can enable it later in your device settings.',
                                        [{ text: 'OK' }]
                                    );
                                    return;
                                }

                                // Get current location
                                const location = await getCurrentLocation({
                                    enableHighAccuracy: true,
                                    timeout: 15000,
                                    maximumAge: 0,
                                });

                                // Update location on backend
                                await updateLocationOnBackend(location.latitude, location.longitude, authToken);
                                console.log('Location updated successfully');
                            } catch (error: any) {
                                console.error('Failed to get/update location:', error);
                                Alert.alert(
                                    'Location Error',
                                    error.message || 'Failed to get your location. You can update it later in your profile settings.',
                                    [{ text: 'OK' }]
                                );
                            }
                        },
                    },
                ],
                { cancelable: true }
            );
        } catch (error) {
            console.error('Error requesting location:', error);
        }
    };

    const refreshUser = async () => {
        if (!token) return;
        const res = await apiFetch(ENDPOINTS.profile.me, { token });
        setUser(res.user as ApiUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res.user));
    };

    const updateProfile = async (data: { username?: string; city?: string; bio?: string; profile_photo?: string; password?: string }) => {
        if (!token) {
            throw new Error('Not authenticated');
        }
        const res = await apiFetch(ENDPOINTS.profile.update, { method: 'PUT', token, body: data });
        setUser(res.user as ApiUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res.user));
    };

    const updatePassword = async (data: { current_password: string; new_password: string; new_password_confirmation: string }) => {
        if (!token) {
            throw new Error('Not authenticated');
        }
        await apiFetch(ENDPOINTS.profile.updatePassword, { method: 'PUT', token, body: data });
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
    };

    const value = useMemo(
        () => ({
            user,
            token,
            loading,
            sendOtp,
            sendEmailOtp,
            verifyOtp,
            verifyPhoneForSeller,
            login,
            register,
            refreshUser,
            updateProfile,
            updatePassword,
            logout,
        }),
        [user, token, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
