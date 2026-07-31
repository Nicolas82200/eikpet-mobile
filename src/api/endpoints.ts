import { apiRequest, apiUpload } from './client';
import { saveTokens, clearTokens } from '../auth/token-storage';
import { getRefreshToken } from '../auth/token-storage';
import type {
  Animal,
  AuthTokens,
  CalendarEntry,
  DocumentCategory,
  DocumentRecord,
  Household,
  HouseholdMember,
  HealthEntry,
  MedicalProfile,
} from '../types/api';

// --- Auth ---

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  householdName?: string;
  inviteCode?: string;
}): Promise<void> {
  const tokens = await apiRequest<AuthTokens>('/auth/register', {
    method: 'POST',
    body: input,
    authenticated: false,
  });
  await saveTokens(tokens);
}

export async function login(email: string, password: string): Promise<void> {
  const tokens = await apiRequest<AuthTokens>('/auth/login', {
    method: 'POST',
    body: { email, password },
    authenticated: false,
  });
  await saveTokens(tokens);
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
  }
  await clearTokens();
}

// --- Foyers ---

export function listHouseholds(): Promise<(Household & { role: 'owner' | 'member' })[]> {
  return apiRequest('/households');
}

export function createHousehold(name: string): Promise<Household> {
  return apiRequest('/households', { method: 'POST', body: { name } });
}

export function listHouseholdMembers(householdId: number): Promise<HouseholdMember[]> {
  return apiRequest(`/households/${householdId}/members`);
}

// --- Animaux ---

export function listAnimals(householdId: number): Promise<Animal[]> {
  return apiRequest(`/households/${householdId}/animals`);
}

export function getAnimal(animalId: number): Promise<Animal> {
  return apiRequest(`/animals/${animalId}`);
}

export function createAnimal(householdId: number, input: Partial<Animal>): Promise<Animal> {
  return apiRequest(`/households/${householdId}/animals`, { method: 'POST', body: input });
}

export function updateAnimal(animalId: number, input: Partial<Animal>): Promise<Animal> {
  return apiRequest(`/animals/${animalId}`, { method: 'PATCH', body: input });
}

// --- Fiche medicale ---

export function getMedicalProfile(animalId: number): Promise<MedicalProfile | null> {
  return apiRequest(`/animals/${animalId}/medical-profile`);
}

export function upsertMedicalProfile(animalId: number, input: Partial<MedicalProfile>): Promise<MedicalProfile> {
  return apiRequest(`/animals/${animalId}/medical-profile`, { method: 'PUT', body: input });
}

// --- Carnet de sante ---

export function listHealthEntries(animalId: number): Promise<HealthEntry[]> {
  return apiRequest(`/animals/${animalId}/health-entries`);
}

export function createHealthEntry(
  animalId: number,
  input: Partial<HealthEntry> & { recurrenceMonths?: number },
): Promise<HealthEntry> {
  return apiRequest(`/animals/${animalId}/health-entries`, { method: 'POST', body: input });
}

// --- Calendrier ---

export function listUpcomingReminders(householdId: number): Promise<CalendarEntry[]> {
  return apiRequest(`/households/${householdId}/calendar`);
}

// --- Notifications push ---

export function registerPushToken(fcmToken: string, deviceInfo?: string): Promise<void> {
  return apiRequest('/notifications/push-tokens', { method: 'POST', body: { fcmToken, deviceInfo } });
}

// --- Documents ---

export function listDocumentsForHousehold(householdId: number): Promise<DocumentRecord[]> {
  return apiRequest(`/households/${householdId}/documents`);
}

export function listDocumentsForAnimal(animalId: number): Promise<DocumentRecord[]> {
  return apiRequest(`/animals/${animalId}/documents`);
}

export async function uploadDocument(
  householdId: number,
  file: { uri: string; name: string; type: string },
  category: DocumentCategory,
  animalId?: number,
): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  formData.append('category', category);
  if (animalId) {
    formData.append('animalId', String(animalId));
  }
  return apiUpload(`/households/${householdId}/documents`, formData);
}
