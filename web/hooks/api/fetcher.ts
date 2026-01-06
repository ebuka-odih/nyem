import { apiFetch, ApiOptions, getStoredToken } from '../../utils/api';

/**
 * Generic fetcher function for React Query
 */
export const fetcher = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
    const token = getStoredToken();
    const response = await apiFetch<T>(path, { ...options, token });

    // Handle the different response formats the backend returns
    if (response.data !== undefined) return response.data as T;
    if (response.user !== undefined) return response.user as T;
    if (response.listings !== undefined) return response.listings as T;
    if (response.items !== undefined) return response.items as T;
    if (response.requests !== undefined) return response.requests as T;
    if (response.conversations !== undefined) return response.conversations as T;
    if (response.messages !== undefined) return response.messages as T;

    return response as T;
};
