/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { apiFetch, getStoredToken, storeToken, removeToken, getStoredUser, storeUser } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

// Debug: Verify endpoints are loaded correctly
if (typeof ENDPOINTS === 'undefined' || !ENDPOINTS.auth) {
  console.error('[AuthContext] ENDPOINTS not properly loaded:', ENDPOINTS);
}
import { getCurrentLocation, updateLocationOnBackend, requestLocationPermission } from '../utils/location';

// User type definition
export interface User {
  id: number;
  username: string;
  name?: string;
  phone?: string;
  email?: string;
  email_verified_at?: string;
  phone_verified_at?: string;
  city?: string;
  city_id?: number;
  area_id?: number;
  bio?: string;
  profile_photo?: string;
  items_count?: number; // Number of items user has uploaded
  created_at?: string;
  updated_at?: string;
  cityLocation?: {
    id: number;
    name: string;
    type: string;
  };
  areaLocation?: {
    id: number;
    name: string;
    type: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<{ debug_code?: string }>;
  sendEmailOtp: (email: string) => Promise<{ debug_code?: string }>;
  verifyOtp: (payload: {
    phone?: string;
    email?: string;
    code: string;
    name?: string;
    username?: string;
    bio?: string;
    profile_photo?: string;
    city?: string;
    password?: string;
  }) => Promise<{ new_user: boolean }>;
  verifyPhoneForSeller: (phone: string, code: string) => Promise<void>;
  login: (usernameOrPhone: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    name: string;
    password: string;
  }) => Promise<{ requires_verification: boolean; email: string }>;
  loginWithGoogle: () => Promise<{ new_user: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
    username?: string;
    name?: string;
    city?: string;
    city_id?: number;
    area_id?: number;
    bio?: string;
    profile_photo?: string;
    password?: string;
  }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage immediately (synchronous) for instant hydration
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(false); // Start as false - we have cached state

  // Validate token in background after initial render (non-blocking)
  useEffect(() => {
    // Only validate if we have a token - don't block if no token exists
    if (!token || !user) {
      return;
    }

    // Validate token asynchronously after first paint
    // Use requestIdleCallback if available, otherwise setTimeout
    const validateToken = async () => {
      try {
        const res = await apiFetch<{ user: User }>(ENDPOINTS.profile.me, { token });
        const updatedUser = res.user || res.data?.user;
        if (updatedUser) {
          setUser(updatedUser);
          storeUser(updatedUser);
        }
      } catch (error) {
        // Token is invalid, clear auth state silently
        console.warn('[AuthContext] Token validation failed, clearing auth state:', error);
        removeToken();
        setUser(null);
        setToken(null);
      }
    };

    // Defer validation to avoid blocking initial render
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(validateToken, { timeout: 2000 });
    } else {
      setTimeout(validateToken, 100);
    }
  }, []); // Only run once on mount

  const sendOtp = async (phone: string): Promise<{ debug_code?: string }> => {
    const res = await apiFetch(ENDPOINTS.auth.sendOtp, {
      method: 'POST',
      body: { phone },
    });
    return { debug_code: res.debug_code as string | undefined };
  };

  const sendEmailOtp = async (email: string): Promise<{ debug_code?: string }> => {
    // Ensure endpoint exists - use fallback if ENDPOINTS is not loaded
    const endpoint = ENDPOINTS?.auth?.sendEmailOtp || '/auth/send-email-otp';
    if (!endpoint || endpoint === 'undefined') {
      console.error('[AuthContext] sendEmailOtp endpoint is invalid', { endpoint, ENDPOINTS });
      throw new Error('Email OTP endpoint is not configured. Please check endpoints configuration.');
    }
    
    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: { email },
    });
    return { debug_code: res.debug_code as string | undefined };
  };

  const verifyOtp = async (payload: {
    phone?: string;
    email?: string;
    code: string;
    name?: string;
    username?: string;
    bio?: string;
    profile_photo?: string;
    city?: string;
    password?: string;
  }): Promise<{ new_user: boolean }> => {
    const res = await apiFetch<{ user: User; token: string; new_user?: boolean }>(
      ENDPOINTS.auth.verifyOtp,
      {
        method: 'POST',
        body: payload,
      }
    );

    const authToken = res.token as string;
    const userData = (res.user || res.data?.user) as User;

    setToken(authToken);
    setUser(userData);
    storeToken(authToken);
    storeUser(userData);

    // Request location after successful login
    requestUserLocation(authToken);

    return { new_user: Boolean(res.new_user) };
  };

  const verifyPhoneForSeller = async (phone: string, code: string): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const res = await apiFetch<{ user: User }>(ENDPOINTS.auth.verifyPhoneForSeller, {
      method: 'POST',
      token,
      body: { phone, code },
    });

    const userData = (res.user || res.data?.user) as User;
    setUser(userData);
    storeUser(userData);
  };

  const login = async (usernameOrPhone: string, password: string): Promise<void> => {
    const res = await apiFetch<{ user: User; token: string }>(ENDPOINTS.auth.login, {
      method: 'POST',
      body: { username_or_phone: usernameOrPhone, password },
    });

    const authToken = res.token as string;
    const userData = (res.user || res.data?.user) as User;

    setToken(authToken);
    setUser(userData);
    storeToken(authToken);
    storeUser(userData);

    // Request location after successful login
    requestUserLocation(authToken);
  };

  const register = async (payload: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ requires_verification: boolean; email: string }> => {
    const res = await apiFetch<{ requires_verification?: boolean; email?: string }>(
      ENDPOINTS.auth.register,
      {
        method: 'POST',
        body: payload,
      }
    );

    // Registration now requires email verification
    // User is not created until email is verified
    return {
      requires_verification: res.requires_verification ?? true,
      email: res.email ?? payload.email,
    };
  };

  /**
   * Sign in with Google OAuth
   * Uses Google Identity Services to authenticate user
   */
  const loginWithGoogle = async (): Promise<{ new_user: boolean }> => {
    return new Promise((resolve, reject) => {
      // Wait for Google Identity Services to load
      const checkGoogleLoaded = () => {
        if (typeof window !== 'undefined' && (window as any).google) {
          initializeGoogleSignIn(resolve, reject);
        } else {
          setTimeout(checkGoogleLoaded, 100);
        }
      };
      checkGoogleLoaded();
    });
  };

  /**
   * Initialize Google Sign-In using Google Identity Services
   * Uses the popup flow for button-triggered sign-in
   */
  const initializeGoogleSignIn = (
    resolve: (value: { new_user: boolean }) => void,
    reject: (error: any) => void
  ) => {
    const google = (window as any).google;
    // Get client ID from environment variable
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '799510192998-ieg4vffmi0f6t0pge5unm80m1oq2t68p.apps.googleusercontent.com';
    
    // Validate client ID is set
    if (!clientId || clientId.trim() === '') {
      reject(new Error('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.'));
      return;
    }
    
    console.log('[Google Auth] Client ID:', clientId.substring(0, 20) + '...');

    // Use OAuth 2.0 popup flow (initTokenClient)
    // Note: For this flow, the origin (window.location.origin) must be registered
    // in Google Cloud Console under BOTH:
    // 1. "Authorized JavaScript origins" (required)
    // 2. "Authorized redirect URIs" (also required for popup flow)
    // Example: http://localhost:5173 (dev) or https://www.nyem.online (prod)
    // IMPORTANT: The redirect URI must be the exact origin (no path) for popup flow
    const currentOrigin = window.location.origin;
    console.log('[Google Auth] Using origin:', currentOrigin);
    
    google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile',
      // Explicitly set redirect_uri to the current origin
      // This must match exactly what's in Google Cloud Console "Authorized redirect URIs"
      redirect_uri: currentOrigin,
      callback: async (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        try {
          // Get user info using the access token
          // The initTokenClient popup flow returns an access_token directly
          const userInfoResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
          );
          
          if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch user info from Google');
          }
          
          const userInfo = await userInfoResponse.json();

          // Send access token and user info to backend for verification and user creation
          // Backend will verify the token with Google and create/update the user
          const res = await apiFetch<{ user: User; token: string; new_user?: boolean }>(
            ENDPOINTS.auth.google,
            {
              method: 'POST',
              body: { 
                access_token: response.access_token,
                // Include user info for faster user creation (optional, backend will verify)
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
              },
            }
          );

          const authToken = res.token as string;
          const userData = (res.user || res.data?.user) as User;

          setToken(authToken);
          setUser(userData);
          storeToken(authToken);
          storeUser(userData);

          // Request location after successful login
          requestUserLocation(authToken);

          resolve({ new_user: Boolean(res.new_user) });
        } catch (error: any) {
          console.error('Google sign-in error:', error);
          reject(error);
        }
      },
    }).requestAccessToken();
  };

  /**
   * Request user location and update on backend
   * Shows a confirmation dialog to ask for permission first
   */
  const requestUserLocation = async (authToken: string) => {
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        return;
      }

      // Show confirmation dialog
      const userConfirmed = window.confirm(
        'To help you find nearby users and items, we need your location. Would you like to share your location?'
      );

      if (!userConfirmed) {
        console.log('User declined location access');
        return;
      }

      // Request permission and get location
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        alert('Location permission is required to find nearby users. You can enable it later in your browser settings.');
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
      // Don't show alert for user cancellation, only for errors
      if (error.message && !error.message.includes('denied')) {
        alert(error.message || 'Failed to get your location. You can update it later in your profile settings.');
      }
    }
  };

  const logout = async (): Promise<void> => {
    removeToken();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async (): Promise<void> => {
    if (!token) return;

    const res = await apiFetch<{ user: User }>(ENDPOINTS.profile.me, { token });
    const userData = (res.user || res.data?.user) as User;
    setUser(userData);
    storeUser(userData);
  };

  const updateProfile = async (data: {
    username?: string;
    name?: string;
    city?: string;
    city_id?: number;
    area_id?: number;
    bio?: string;
    profile_photo?: string;
    password?: string;
  }): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const res = await apiFetch<{ user: User }>(ENDPOINTS.profile.update, {
      method: 'PUT',
      token,
      body: data,
    });

    const userData = (res.user || res.data?.user) as User;
    setUser(userData);
    storeUser(userData);
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    await apiFetch(ENDPOINTS.profile.updatePassword, {
      method: 'PUT',
      token,
      body: {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      },
    });
  };

  // Memoize the context value to prevent unnecessary re-renders and hot reload issues
  // Functions are stable within the component, so we only need to depend on state values
  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    sendOtp,
    sendEmailOtp,
    verifyOtp,
    verifyPhoneForSeller,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshUser,
    updateProfile,
    updatePassword,
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

