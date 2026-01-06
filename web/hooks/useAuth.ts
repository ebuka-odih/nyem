import { useState, useEffect } from 'react';
import { getStoredToken, removeToken } from '../utils/api';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

export type AuthState = 'welcome' | 'login' | 'register' | 'otp' | 'forgot' | 'authenticated' | 'discover';

export const useAuth = () => {
  // Initialize authState from localStorage synchronously to prevent showing login on refresh
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    // If we have both token and user, set to 'discover' (same as after login)
    // We'll validate the token in the background
    if (token && user) {
      return 'discover';
    }
    return 'welcome';
  });

  const [tempUserEmail, setTempUserEmail] = useState("");
  const [tempRegisterData, setTempRegisterData] = useState<{ name: string; password: string } | null>(null);

  // Validate existing auth token on mount (runs in background)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    if (token && user) {
      // Validate token by checking user profile
      const validateToken = async () => {
        try {
          const { apiFetch } = await import('../utils/api');
          const { ENDPOINTS } = await import('../constants/endpoints');
          const response = await apiFetch(ENDPOINTS.profile.me, { token });
          if (response.user || response.data?.user) {
            // Token is valid, ensure we're in discover state (same as after login)
            setAuthState('discover');
          } else {
            // Token invalid, clear it and redirect to welcome
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setAuthState('welcome');
          }
        } catch (error: any) {
          // Check if this is an authentication error (401, 403) vs server/network error
          const errorMessage = error?.message || String(error || '');

          // Explicitly check for authentication errors
          const isAuthError =
            errorMessage.includes('401') ||
            errorMessage.includes('403') ||
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('Unauthenticated') ||
            errorMessage.includes('Invalid credentials');

          // Explicitly check for server errors (500, 502, 503, 504, etc.)
          const isServerError =
            errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504') ||
            errorMessage.includes('Server error') ||
            errorMessage.includes('Internal Server Error') ||
            errorMessage.includes('Service temporarily unavailable');

          // Check if it's a network error (shouldn't clear token)
          const isNetworkError =
            errorMessage.includes('Network error') ||
            errorMessage.includes('Cannot connect') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('Cannot reach API') ||
            error?.name === 'TypeError';

          // Only clear token on authentication errors, not server errors or network errors
          if (isAuthError && !isServerError && !isNetworkError) {
            // Token invalid, clear it and redirect to welcome
            console.warn('[App] Token validation failed (auth error), clearing auth state:', errorMessage);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setAuthState('welcome');
          } else {
            // Server error (500, 503, etc.) or network error - keep token, just log warning
            // The token might still be valid, it's just the server having issues or network problems
            const errorType = isServerError ? 'server error' : (isNetworkError ? 'network error' : 'unknown error');
            console.warn(`[App] Token validation failed (${errorType}), keeping auth state. Error:`, errorMessage);
            // Keep the user logged in - don't clear token or change auth state
            // The authState should remain 'discover' from the initial state
          }
        }
      };
      validateToken();
    } else {
      // No token found, ensure we're in welcome state
      // If we're in an authenticated state (discover or authenticated) but no token, reset to welcome
      if (authState === 'authenticated' || authState === 'discover') {
        setAuthState('welcome');
      }
    }
  }, []);

  const hasValidToken = localStorage.getItem('auth_token') !== null;
  const isAuthenticated = authState === 'authenticated' && hasValidToken;

  const signOut = () => {
    removeToken();
    setAuthState('welcome');
  };

  return {
    authState,
    setAuthState,
    tempUserEmail,
    setTempUserEmail,
    tempRegisterData,
    setTempRegisterData,
    hasValidToken,
    isAuthenticated,
    signOut
  };
};

