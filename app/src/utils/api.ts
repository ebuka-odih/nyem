import Constants from 'expo-constants';
import { Platform } from 'react-native';

const envBase =
    process.env.EXPO_PUBLIC_API_BASE ??
    process.env.API_BASE ??
    Constants.expoConfig?.extra?.apiBase;

// Use local IP for mobile devices (physical devices and emulators)
// Use localhost for web
const localBase =
    Platform.OS === 'web'
        ? 'http://localhost:8001/api'
        : 'http://192.168.0.134:8001/api';

export const API_BASE = envBase || localBase;

console.log('[API Config] Platform:', Platform.OS);
console.log('[API Config] expoConfig.extra.apiBase:', Constants.expoConfig?.extra?.apiBase);
console.log('[API Config] EXPO_PUBLIC_API_BASE:', process.env.EXPO_PUBLIC_API_BASE);
console.log('[API Config] API_BASE:', process.env.API_BASE);
console.log('[API Config] Final API_BASE:', API_BASE);

type ApiOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown> | FormData;
    token?: string | null;
};

export async function apiFetch(path: string, options: ApiOptions = {}) {
    const { method = 'GET', body, token } = options;
    const headers: Record<string, string> = {
        Accept: 'application/json',
    };

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (!isFormData) {
        headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const url = `${API_BASE}${path}`;
    console.log('[apiFetch]', method, url);

    let response: Response;
    try {
        // Ensure proper UTF-8 encoding for JSON body
        let bodyData: string | FormData | undefined = undefined;
        if (body) {
            if (isFormData) {
                bodyData = body as FormData;
            } else {
                // Use JSON.stringify which properly handles UTF-8 including emojis
                bodyData = JSON.stringify(body);
            }
        }

        response = await fetch(url, {
            method,
            headers,
            body: bodyData,
        });
    } catch (err: any) {
        console.error('[apiFetch][network-error]', method, url, err?.message || err);
        throw err;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            console.warn('Unauthorized - token may be invalid');
        }
        const message = data?.message || 'Request failed';
        throw new Error(message);
    }

    return data;
}
