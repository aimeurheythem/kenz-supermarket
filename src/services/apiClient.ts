/**
 * POS API client for communicating with the Django backend.
 *
 * Handles JWT token management:
 * - Attaches access token to all requests
 * - Auto-refreshes on 401 using cached refresh token
 * - Falls back to re-auth prompt when refresh fails
 */

import { getCachedRefreshToken, updateCachedRefreshToken } from './cachedAuth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

let accessToken: string | null = null;
let currentUserId: string | null = null;

interface ApiClientOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

/**
 * Set the access token and user ID for authenticated requests.
 */
export function setAuthTokens(access: string, userId: string): void {
  accessToken = access;
  currentUserId = userId;
}

/**
 * Clear auth tokens (on logout).
 */
export function clearAuthTokens(): void {
  accessToken = null;
  currentUserId = null;
}

/**
 * Get current access token.
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Make an authenticated API request.
 */
async function request<T = unknown>(
  path: string,
  options: ApiClientOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (accessToken) {
    reqHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: reqHeaders,
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response = await fetch(`${BASE_URL}${path}`, fetchOptions);

  // Auto-refresh on 401
  if (response.status === 401 && currentUserId && !path.includes('/auth/token')) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request with the new token
      reqHeaders['Authorization'] = `Bearer ${accessToken}`;
      fetchOptions.headers = reqHeaders;
      response = await fetch(`${BASE_URL}${path}`, fetchOptions);
    }
  }

  const data = response.status === 204 ? (null as T) : ((await response.json()) as T);

  if (!response.ok) {
    const error = new Error((data as any)?.detail || `Request failed: ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return { data, status: response.status, ok: response.ok };
}

/**
 * Attempt to refresh the access token using the cached refresh token.
 */
async function tryRefreshToken(): Promise<boolean> {
  if (!currentUserId) return false;

  const refreshToken = getCachedRefreshToken(currentUserId);
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    accessToken = data.access;

    // If a new refresh token was returned (rotation), update cache
    if (data.refresh) {
      updateCachedRefreshToken(currentUserId, data.refresh);
    }

    return true;
  } catch {
    return false;
  }
}

// Convenience methods
export const apiClient = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export default apiClient;
