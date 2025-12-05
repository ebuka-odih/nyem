/**
 * API Client Utility
 * Handles all API requests to the backend
 */

// API Base URL - can be configured via environment variable
// Defaults to localhost for development, production URL for production
const getApiBase = () => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // In development (localhost), use local Laravel server
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // Production fallback
  return 'https://nyem.gnosisbrand.com/backend/public/api';
};

const API_BASE = getApiBase();
console.log('[API Config] Using API Base URL:', API_BASE);

// CSRF cookie cache to avoid fetching it multiple times
let csrfCookieFetched = false;
let csrfCookiePromise: Promise<void> | null = null;

/**
 * Reset CSRF cookie flag - useful when we get a 419 error
 */
function resetCsrfCookie(): void {
  csrfCookieFetched = false;
  csrfCookiePromise = null;
}

/**
 * Get XSRF token from cookies (Laravel stores it as XSRF-TOKEN)
 */
function getXsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Get CSRF cookie from Sanctum for stateful authentication
 * This is required when using Sanctum with stateful domains (like localhost)
 */
async function ensureCsrfCookie(forceRefresh = false): Promise<void> {
  // Force refresh if requested (e.g., after a 419 error)
  if (forceRefresh) {
    resetCsrfCookie();
  }

  // If we already have the cookie or are fetching it, wait for it
  if (csrfCookieFetched) {
    return;
  }

  if (csrfCookiePromise) {
    return csrfCookiePromise;
  }

  // Only fetch CSRF cookie for localhost/stateful domains
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  if (!isLocalhost) {
    csrfCookieFetched = true;
    return;
  }

  // Extract base URL without /api
  const baseUrl = API_BASE.replace('/api', '');
  const csrfUrl = `${baseUrl}/sanctum/csrf-cookie`;

  console.log('[API] Fetching CSRF cookie from:', csrfUrl);

  csrfCookiePromise = fetch(csrfUrl, {
    method: 'GET',
    credentials: 'include', // Important: include cookies
    headers: {
      Accept: 'application/json',
    },
  })
    .then((response) => {
      if (response.ok) {
        console.log('[API] CSRF cookie fetched successfully');
        csrfCookieFetched = true;
      } else {
        console.warn('[API] CSRF cookie fetch returned status:', response.status);
        csrfCookieFetched = false;
      }
      csrfCookiePromise = null;
    })
    .catch((error) => {
      console.warn('[API] Failed to fetch CSRF cookie:', error);
      csrfCookieFetched = false;
      csrfCookiePromise = null;
      // Don't throw - continue without CSRF cookie (might work with token auth)
    });

  return csrfCookiePromise;
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown> | FormData;
  token?: string | null;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  user?: T;
  token?: string;
  [key: string]: any;
}

/**
 * Main API fetch function
 * Handles authentication, error handling, and response parsing
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {},
  retryOn419 = true
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token, headers = {} } = options;

  // For POST/PUT/DELETE requests on localhost, ensure we have CSRF cookie
  // This is required for Sanctum stateful authentication
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    await ensureCsrfCookie();
  }

  // Build headers
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  // Set Content-Type for JSON (skip for FormData)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && body) {
    requestHeaders['Content-Type'] = 'application/json; charset=utf-8';
  }

  // Add XSRF token from cookie if available (required for Laravel Sanctum stateful auth)
  // Laravel stores the CSRF token in XSRF-TOKEN cookie and expects it as X-XSRF-TOKEN header
  const xsrfToken = getXsrfToken();
  if (xsrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    requestHeaders['X-XSRF-TOKEN'] = xsrfToken;
  }

  // Add authentication token if provided
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  // Build full URL
  const url = `${API_BASE}${path}`;
  console.log('[apiFetch]', method, url);

  try {
    // Prepare body data
    let bodyData: string | FormData | undefined = undefined;
    if (body) {
      if (isFormData) {
        bodyData = body as FormData;
      } else {
        bodyData = JSON.stringify(body);
      }
    }

    // Make request with credentials for CSRF cookie support
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: bodyData,
      credentials: 'include', // Include cookies for CSRF token
    });

    // Parse response
    let data: any = {};
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      // If not JSON, try to get text
      const text = await response.text().catch(() => '');
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text || `Server returned ${response.status}` };
        }
      }
    }

    // Handle errors
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('[apiFetch] Unauthorized - token may be invalid');
        // Clear invalid token from storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      
      // Provide more specific error messages for common status codes
      let message = data?.message || data?.error || `Request failed with status ${response.status}`;
      
      if (response.status === 419) {
        // CSRF token mismatch - reset CSRF cookie and retry once if enabled
        resetCsrfCookie();
        
        // Retry the request once with a fresh CSRF cookie
        if (retryOn419 && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          console.log('[apiFetch] 419 error - retrying with fresh CSRF cookie...');
          
          // Fetch fresh CSRF cookie
          await ensureCsrfCookie(true);
          
          // Retry the request once
          try {
            const retryResponse = await fetch(url, {
              method,
              headers: requestHeaders,
              body: bodyData,
              credentials: 'include',
            });

            // If retry succeeds, parse and return the response
            if (retryResponse.ok) {
              const contentType = retryResponse.headers.get('content-type');
              let retryData: any = {};
              if (contentType && contentType.includes('application/json')) {
                retryData = await retryResponse.json().catch(() => ({}));
              } else {
                const text = await retryResponse.text().catch(() => '');
                if (text) {
                  try {
                    retryData = JSON.parse(text);
                  } catch {
                    retryData = { message: text || `Server returned ${retryResponse.status}` };
                  }
                }
              }
              console.log('[apiFetch] Retry successful after 419 error');
              return retryData;
            }
          } catch (retryError) {
            console.warn('[apiFetch] Retry after 419 error failed:', retryError);
            // Fall through to throw the original error
          }
        }
        
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
          message = `CSRF token mismatch (419). This usually means the session expired. Please try again.`;
        } else {
          message = `CSRF token mismatch (419). Please refresh the page and try again.`;
        }
      } else if (response.status === 503) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
          message = `Backend server error (503). Please check: 1) Laravel backend is running (php artisan serve), 2) Database is configured and migrated, 3) Check backend logs for errors. API URL: ${url}`;
        } else {
          message = `Service temporarily unavailable (503). The backend server may be down or experiencing issues.`;
        }
      } else if (response.status === 404) {
        message = `API endpoint not found (404). Check that the route exists: ${url}`;
      } else if (response.status === 500) {
        message = `Server error (500). Check backend logs for details.`;
      }
      
      throw new Error(message);
    }

    return data;
  } catch (error: any) {
    console.error('[apiFetch][error]', method, url, error?.message || error);
    
    // Provide more helpful error messages for common network issues
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      try {
        const apiHost = new URL(API_BASE).hostname;
        
        if (isLocalhost && (apiHost === 'localhost' || apiHost === '127.0.0.1')) {
          throw new Error(
            'Cannot connect to backend API. Please ensure: 1) Laravel backend is running (php artisan serve), 2) Backend is accessible at http://localhost:8000, 3) CORS is properly configured in backend/config/cors.php'
          );
        } else {
          throw new Error(
            `Network error: Cannot reach API server at ${API_BASE}. Please check your internet connection or API server status.`
          );
        }
      } catch (urlError) {
        // If API_BASE is not a valid URL, provide a generic error
        throw new Error(
          `Network error: Cannot connect to API server. Please check that the backend is running and accessible.`
        );
      }
    }
    
    throw error;
  }
}

/**
 * Get stored auth token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Store auth token in localStorage
 */
export function storeToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Remove auth token from localStorage
 */
export function removeToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): any | null {
  const userStr = localStorage.getItem('auth_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Store user in localStorage
 */
export function storeUser(user: any): void {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

/**
 * Test API connection - useful for debugging
 */
export async function testApiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/`);
    const data = await response.json().catch(() => ({}));
    
    if (response.ok) {
      return { success: true, message: 'API connection successful' };
    } else {
      return { 
        success: false, 
        message: `API returned status ${response.status}: ${data.message || 'Unknown error'}` 
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: `Connection failed: ${error.message || 'Cannot reach API server'}` 
    };
  }
}

