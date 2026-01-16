import { useState, useEffect } from 'react';
import { storeToken, storeUser, apiFetch, removeToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { queryClient } from './api/queryClient';

export type AuthState = 'welcome' | 'login' | 'register' | 'otp' | 'forgot' | 'authenticated' | 'discover';

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>(() => {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('auth_user');
        if (token && user) return 'discover';
        return 'welcome';
    });

    const [tempUserEmail, setTempUserEmail] = useState("");
    const [tempRegisterData, setTempRegisterData] = useState<{ name: string; password: string } | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const googleAuthSuccess = urlParams.get('google_auth') === 'success';
        const token = urlParams.get('token');

        if (googleAuthSuccess && token) {
            storeToken(token);
            const fetchProfile = async () => {
                try {
                    const response = await apiFetch(ENDPOINTS.profile.me, { token });
                    const user = response.user || response.data?.user;
                    if (user) {
                        storeUser(user);
                        setAuthState('discover');
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } catch (error) {
                    console.error('[Auth] Failed to fetch profile after Google redirect:', error);
                }
            };
            fetchProfile();
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('auth_user');
        if (token && user) {
            const validateToken = async () => {
                try {
                    const response = await apiFetch(ENDPOINTS.profile.me, { token });
                    if (response.user || response.data?.user) {
                        setAuthState('discover');
                    } else {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_user');
                        setAuthState('welcome');
                    }
                } catch (error: any) {
                    const errorMessage = error?.message || String(error || '');
                    const isAuthError = errorMessage.includes('401') || errorMessage.includes('403') ||
                        errorMessage.includes('Unauthorized') || errorMessage.includes('Unauthenticated');
                    if (isAuthError) {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_user');
                        setAuthState('welcome');
                    }
                }
            };
            validateToken();
        } else if (authState === 'authenticated' || authState === 'discover') {
            setAuthState('welcome');
        }
    }, []);

    const hasValidToken = localStorage.getItem('auth_token') !== null;
    const isAuthenticated = authState === 'authenticated' && hasValidToken;

    const clearSessionData = () => {
        queryClient.clear();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('discover_state_')) localStorage.removeItem(key);
        });
        localStorage.removeItem('has_seen_welcome_card');
    };

    const signOut = () => {
        clearSessionData();
        removeToken();
        setAuthState('welcome');
    };

    return {
        authState, setAuthState, tempUserEmail, setTempUserEmail,
        tempRegisterData, setTempRegisterData, hasValidToken,
        isAuthenticated, signOut, clearSessionData
    };
};
