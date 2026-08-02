import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiBaseUrl?: string;
  revenueCatApiKeyIos?: string;
  revenueCatApiKeyAndroid?: string;
};

// A adapter selon l'environnement (dev local, VPS de prod) via app.json > expo.extra.apiBaseUrl
export const API_BASE_URL = extra.apiBaseUrl ?? 'http://localhost:3000';

// Cles publiques RevenueCat (une par plateforme), configurees dans app.json > expo.extra
export const REVENUECAT_API_KEY_IOS = extra.revenueCatApiKeyIos ?? '';
export const REVENUECAT_API_KEY_ANDROID = extra.revenueCatApiKeyAndroid ?? '';
