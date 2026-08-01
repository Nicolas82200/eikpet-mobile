import { API_BASE_URL } from './config';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../auth/token-storage';
import type { AuthTokens } from '../types/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Code d'erreur metier renvoye par le backend (ex: 'PLAN_LIMIT_ANIMAL'), le cas echeant. */
    public readonly errorCode?: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<void> | null = null;

/**
 * NestJS renvoie un corps vide (Content-Length: 0) pour un handler qui retourne `null`,
 * pas le litteral JSON "null". response.json() plante sur un corps vide ("Unexpected end
 * of input") : on passe par response.text() et on ne parse que si non-vide.
 */
async function parseJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

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
  const tokens = await parseJsonBody<AuthTokens>(response);
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
    const errorBody = await parseJsonBody<{ message?: string; errorCode?: string }>(response).catch(() => ({
      message: undefined,
      errorCode: undefined,
    }));
    throw new ApiError(
      response.status,
      errorBody?.message ?? response.statusText ?? 'Erreur inconnue',
      errorBody?.errorCode,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return parseJsonBody<T>(response);
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
    const errorBody = await parseJsonBody<{ message?: string; errorCode?: string }>(response).catch(() => ({
      message: undefined,
      errorCode: undefined,
    }));
    throw new ApiError(
      response.status,
      errorBody?.message ?? response.statusText ?? 'Erreur inconnue',
      errorBody?.errorCode,
    );
  }
  return parseJsonBody<T>(response);
}
