import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '../types/api';

const ACCESS_TOKEN_KEY = 'eikpet_access_token';
const REFRESH_TOKEN_KEY = 'eikpet_refresh_token';

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

/** Extrait le user id (claim `sub`) du token courant sans verifier la signature (usage cote client uniquement). */
export async function getCurrentUserId(): Promise<number | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload)) as { sub: number };
    return decoded.sub;
  } catch {
    return null;
  }
}
