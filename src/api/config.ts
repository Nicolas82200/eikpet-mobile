import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };

// A adapter selon l'environnement (dev local, VPS de prod) via app.json > expo.extra.apiBaseUrl
export const API_BASE_URL = extra.apiBaseUrl ?? 'http://localhost:3000';
