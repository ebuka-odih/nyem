/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, getStoredToken, storeToken, removeToken, getStoredUser, storeUser } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

// User type definition
export interface User {
  id: number;
  username: string;
  phone: string;
  email?: string;
  city?: string;
  bio?: string;
  profile_photo?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<{ debug_code?: string }>;
  verifyOtp: (payload: {
    phone: string;
    code: string;
    username?: string;
    bio?: string;
    profile_photo?: string;
    city?: string;
    password?: string;
  }) => Promise<{ new_user: boolean }>;
  login: (usernameOrPhone: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    phone: string;
    password: string;
    city?: string;
    profile_photo?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
    username?: string;
    city?: string;
    bio?: string;
    profile_photo?: string;
    password?: string;
  }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Verify token is still valid by fetching user profile
        try {
          const res = await apiFetch<{ user: User }>(ENDPOINTS.profile.me, { token: storedToken });
          setUser(res.user || res.data?.user || storedUser);
          storeUser(res.user || res.data?.user || storedUser);
        } catch (error) {
          // Token is invalid, clear auth state
          console.error('[AuthContext] Token validation failed:', error);
          removeToken();
          setUser(null);
          setToken(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const sendOtp = async (phone: string): Promise<{ debug_code?: string }> => {
    const res = await apiFetch(ENDPOINTS.auth.sendOtp, {
      method: 'POST',
      body: { phone },
    });
    return { debug_code: res.debug_code as string | undefined };
  };

  const verifyOtp = async (payload: {
    phone: string;
    code: string;
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

    return { new_user: Boolean(res.new_user) };
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
  };

  const register = async (payload: {
    username: string;
    phone: string;
    password: string;
    city?: string;
    profile_photo?: string;
  }): Promise<void> => {
    const res = await apiFetch<{ user: User; token: string }>(ENDPOINTS.auth.register, {
      method: 'POST',
      body: payload,
    });

    const authToken = res.token as string;
    const userData = (res.user || res.data?.user) as User;

    setToken(authToken);
    setUser(userData);
    storeToken(authToken);
    storeUser(userData);
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
    city?: string;
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

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    sendOtp,
    verifyOtp,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

