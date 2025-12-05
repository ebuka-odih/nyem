/**
 * Admin API Service
 * Handles all admin-related API calls
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001/api';

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string | number>;
};

async function adminFetch(path: string, options: ApiOptions = {}) {
  const { method = 'GET', body, params } = options;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// Dashboard
export const getDashboardStats = () => adminFetch('/admin/dashboard');

// Users
export const getUsers = (params?: { per_page?: number; search?: string; role?: string; page?: number }) =>
  adminFetch('/admin/users', { params });

export const getUser = (id: string) => adminFetch(`/admin/users/${id}`);

export const updateUser = (id: string, data: { role?: string; username?: string; bio?: string; city?: string }) =>
  adminFetch(`/admin/users/${id}`, { method: 'PUT', body: data });

export const deleteUser = (id: string) => adminFetch(`/admin/users/${id}`, { method: 'DELETE' });

// Matches
export const getMatches = (params?: { per_page?: number; search?: string; page?: number }) =>
  adminFetch('/admin/matches', { params });

export const getMatch = (id: string) => adminFetch(`/admin/matches/${id}`);

export const deleteMatch = (id: string) => adminFetch(`/admin/matches/${id}`, { method: 'DELETE' });

// Items
export const getItems = (params?: { per_page?: number; search?: string; status?: string; category?: string; page?: number }) =>
  adminFetch('/admin/items', { params });

export const getItem = (id: string) => adminFetch(`/admin/items/${id}`);

export const updateItem = (id: string, data: { status?: string }) =>
  adminFetch(`/admin/items/${id}`, { method: 'PUT', body: data });

export const deleteItem = (id: string) => adminFetch(`/admin/items/${id}`, { method: 'DELETE' });

