import { API_BASE_URL } from './config';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../auth/token-storage';
import type { AuthTokens } from '../types/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, 'Aucun refresh token disponible');
  }
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    await clearTokens();
    throw new ApiError(response.status, 'Session expiree');
  }
  const tokens = (await response.json()) as AuthTokens;
  await saveTokens(tokens);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = true } = options;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authenticated) {
      const token = await getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await doFetch();

  if (response.status === 401 && authenticated) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    await refreshPromise;
    response = await doFetch();
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, errorBody.message ?? 'Erreur inconnue');
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Upload multipart (documents) : ne passe pas par apiRequest car le body n'est pas du JSON. */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, errorBody.message ?? 'Erreur inconnue');
  }
  return (await response.json()) as T;
}
