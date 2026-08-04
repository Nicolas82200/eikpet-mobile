import * as FileSystem from 'expo-file-system/legacy';
import { apiRequest, apiUpload } from './client';
import { API_BASE_URL } from './config';
import { saveTokens, clearTokens, getAccessToken , getRefreshToken } from '../auth/token-storage';
import type {
  Animal,
  AnimalBudget,
  AuthTokens,
  BoardingEntry,
  CalendarEntry,
  DocumentCategory,
  DocumentRecord,
  EmergencySheet,
  EmergencyShareLink,
  EmergencyShareLinkWithToken,
  Household,
  HouseholdBudget,
  HouseholdMember,
  HealthEntry,
  MedicalProfile,
  Provider,
  RidingSession,
  SubscriptionStatus,
  SurgicalHistoryEntry,
  Treatment,
  VaccinationScheduleStep,
  WeightEntry,
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

export function forgotPassword(email: string): Promise<void> {
  return apiRequest('/auth/password/forgot', { method: 'POST', body: { email }, authenticated: false });
}

export function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  return apiRequest('/auth/password/reset', {
    method: 'POST',
    body: { email, code, newPassword },
    authenticated: false,
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiRequest('/auth/password', { method: 'PATCH', body: { currentPassword, newPassword } });
}

export function deleteAccount(password: string): Promise<void> {
  return apiRequest('/auth/account', { method: 'DELETE', body: { password } });
}

// --- Abonnement ---

export function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiRequest('/me/subscription');
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

export function regenerateInviteCode(householdId: number): Promise<{ inviteCode: string }> {
  return apiRequest(`/households/${householdId}/invite-code/regenerate`, { method: 'POST' });
}

export function renameHousehold(householdId: number, name: string): Promise<Household> {
  return apiRequest(`/households/${householdId}`, { method: 'PATCH', body: { name } });
}

export function joinHousehold(inviteCode: string): Promise<Household> {
  return apiRequest('/auth/households/join', { method: 'POST', body: { inviteCode } });
}

export function removeMember(householdId: number, userId: number): Promise<void> {
  return apiRequest(`/households/${householdId}/members/${userId}`, { method: 'DELETE' });
}

export function leaveHousehold(householdId: number): Promise<void> {
  return apiRequest(`/households/${householdId}/leave`, { method: 'POST' });
}

export function deleteHousehold(householdId: number): Promise<void> {
  return apiRequest(`/households/${householdId}`, { method: 'DELETE' });
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

export function deleteAnimal(animalId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}`, { method: 'DELETE' });
}

export function getAnimalPhotoUrl(animalId: number): string {
  return `${API_BASE_URL}/animals/${animalId}/photo`;
}

export async function uploadAnimalPhoto(
  animalId: number,
  file: { uri: string; name: string; type: string },
): Promise<Animal> {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  return apiUpload(`/animals/${animalId}/photo`, formData);
}

// --- Fiche d'urgence ---

export function getEmergencySheet(animalId: number): Promise<EmergencySheet> {
  return apiRequest(`/animals/${animalId}/emergency-sheet`);
}

/** Genere un lien de partage temporaire (pet-sitter), lecture seule, sans compte. */
export function createEmergencyShareLink(
  animalId: number,
  expiresInHours?: number,
): Promise<EmergencyShareLinkWithToken> {
  return apiRequest(`/animals/${animalId}/emergency-sheet/share-links`, {
    method: 'POST',
    body: { expiresInHours },
  });
}

export function listEmergencyShareLinks(animalId: number): Promise<EmergencyShareLink[]> {
  return apiRequest(`/animals/${animalId}/emergency-sheet/share-links`);
}

export function revokeEmergencyShareLink(animalId: number, linkId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}/emergency-sheet/share-links/${linkId}`, { method: 'DELETE' });
}

export function buildEmergencySharedUrl(token: string): string {
  return `${API_BASE_URL}/emergency-sheet/shared/${token}`;
}

// --- Fiche medicale ---

export function getMedicalProfile(animalId: number): Promise<MedicalProfile | null> {
  return apiRequest(`/animals/${animalId}/medical-profile`);
}

export function upsertMedicalProfile(animalId: number, input: Partial<MedicalProfile>): Promise<MedicalProfile> {
  return apiRequest(`/animals/${animalId}/medical-profile`, { method: 'PUT', body: input });
}

export function listTreatments(animalId: number): Promise<Treatment[]> {
  return apiRequest(`/animals/${animalId}/treatments`);
}

export function createTreatment(
  animalId: number,
  input: Partial<Omit<Treatment, 'id' | 'animalId'>>,
): Promise<Treatment> {
  return apiRequest(`/animals/${animalId}/treatments`, { method: 'POST', body: input });
}

export function deleteTreatment(animalId: number, treatmentId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}/treatments/${treatmentId}`, { method: 'DELETE' });
}

export function listSurgicalHistory(animalId: number): Promise<SurgicalHistoryEntry[]> {
  return apiRequest(`/animals/${animalId}/surgical-history`);
}

export function createSurgicalHistory(
  animalId: number,
  input: Partial<Omit<SurgicalHistoryEntry, 'id' | 'animalId'>>,
): Promise<SurgicalHistoryEntry> {
  return apiRequest(`/animals/${animalId}/surgical-history`, { method: 'POST', body: input });
}

export function deleteSurgicalHistory(animalId: number, entryId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}/surgical-history/${entryId}`, { method: 'DELETE' });
}

// --- Carnet de sante ---

export function listHealthEntries(animalId: number): Promise<HealthEntry[]> {
  return apiRequest(`/animals/${animalId}/health-entries`);
}

/** Protocole de primo-vaccination suggere (chiot/chaton uniquement) ; undefined si non applicable. */
export function getVaccinationSchedule(animalId: number): Promise<VaccinationScheduleStep[] | undefined> {
  return apiRequest(`/animals/${animalId}/vaccination-schedule`);
}

/** 3.7 Comptes-rendus : historique consolide, reserve a l'abonnement. */
export function listReports(animalId: number): Promise<HealthEntry[]> {
  return apiRequest(`/animals/${animalId}/reports`);
}

export function createHealthEntry(
  animalId: number,
  input: Partial<HealthEntry> & { recurrenceMonths?: number },
): Promise<HealthEntry> {
  return apiRequest(`/animals/${animalId}/health-entries`, { method: 'POST', body: input });
}

export function updateHealthEntry(
  animalId: number,
  entryId: number,
  input: Partial<HealthEntry> & { recurrenceMonths?: number },
): Promise<HealthEntry> {
  return apiRequest(`/animals/${animalId}/health-entries/${entryId}`, { method: 'PUT', body: input });
}

export function deleteHealthEntry(animalId: number, entryId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}/health-entries/${entryId}`, { method: 'DELETE' });
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

export function deleteDocument(documentId: number): Promise<void> {
  return apiRequest(`/documents/${documentId}`, { method: 'DELETE' });
}

// --- Repertoire des intervenants ---

export function listProviders(householdId: number): Promise<Provider[]> {
  return apiRequest(`/households/${householdId}/providers`);
}

export function createProvider(
  householdId: number,
  input: Partial<Omit<Provider, 'id' | 'householdId'>>,
): Promise<Provider> {
  return apiRequest(`/households/${householdId}/providers`, { method: 'POST', body: input });
}

export function updateProvider(
  providerId: number,
  input: Partial<Omit<Provider, 'id' | 'householdId'>>,
): Promise<Provider> {
  return apiRequest(`/providers/${providerId}`, { method: 'PATCH', body: input });
}

export function deleteProvider(providerId: number): Promise<void> {
  return apiRequest(`/providers/${providerId}`, { method: 'DELETE' });
}

/** 3.6 V3 : intervenants geocodes, pour la carte interactive (reserve a l'abonnement). */
export function listProvidersForMap(householdId: number): Promise<Provider[]> {
  return apiRequest(`/households/${householdId}/providers/map`);
}

/** Intervenants lies a un animal precis (un intervenant peut etre associe a plusieurs animaux). */
export function listAnimalProviders(animalId: number): Promise<Provider[]> {
  return apiRequest(`/animals/${animalId}/providers`);
}

export function linkAnimalProvider(animalId: number, providerId: number): Promise<Provider[]> {
  return apiRequest(`/animals/${animalId}/providers`, { method: 'POST', body: { providerId } });
}

export function unlinkAnimalProvider(animalId: number, providerId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}/providers/${providerId}`, { method: 'DELETE' });
}

// --- Pension / hebergement ---

export function listBoardings(animalId: number): Promise<BoardingEntry[]> {
  return apiRequest(`/animals/${animalId}/boardings`);
}

export function createBoarding(
  animalId: number,
  input: Partial<Omit<BoardingEntry, 'id' | 'animalId'>>,
): Promise<BoardingEntry> {
  return apiRequest(`/animals/${animalId}/boardings`, { method: 'POST', body: input });
}

export function updateBoarding(
  animalId: number,
  boardingId: number,
  input: Partial<Omit<BoardingEntry, 'id' | 'animalId'>>,
): Promise<BoardingEntry> {
  return apiRequest(`/animals/${animalId}/boardings/${boardingId}`, { method: 'PATCH', body: input });
}

export function deleteBoarding(animalId: number, boardingId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}/boardings/${boardingId}`, { method: 'DELETE' });
}

// --- Seances chevaux ---

export function listRidingSessions(animalId: number): Promise<RidingSession[]> {
  return apiRequest(`/animals/${animalId}/riding-sessions`);
}

export function createRidingSession(
  animalId: number,
  input: Partial<Omit<RidingSession, 'id' | 'animalId'>>,
): Promise<RidingSession> {
  return apiRequest(`/animals/${animalId}/riding-sessions`, { method: 'POST', body: input });
}

export function updateRidingSession(
  animalId: number,
  sessionId: number,
  input: Partial<Omit<RidingSession, 'id' | 'animalId'>>,
): Promise<RidingSession> {
  return apiRequest(`/animals/${animalId}/riding-sessions/${sessionId}`, { method: 'PATCH', body: input });
}

export function deleteRidingSession(animalId: number, sessionId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}/riding-sessions/${sessionId}`, { method: 'DELETE' });
}

// --- Courbe de poids ---

export function listWeightEntries(animalId: number): Promise<WeightEntry[]> {
  return apiRequest(`/animals/${animalId}/weight-entries`);
}

export function createWeightEntry(
  animalId: number,
  input: { weightKg: number; recordedDate: string; notes?: string },
): Promise<WeightEntry> {
  return apiRequest(`/animals/${animalId}/weight-entries`, { method: 'POST', body: input });
}

export function deleteWeightEntry(animalId: number, entryId: number): Promise<void> {
  return apiRequest(`/animals/${animalId}/weight-entries/${entryId}`, { method: 'DELETE' });
}

// --- Budget (3.9) ---

export function getHouseholdBudget(householdId: number): Promise<HouseholdBudget> {
  return apiRequest(`/households/${householdId}/budget`);
}

export function getAnimalBudget(animalId: number): Promise<AnimalBudget> {
  return apiRequest(`/animals/${animalId}/budget`);
}

/** Telecharge le fichier dans le cache local et renvoie son URI (pour ouverture/partage). */
export async function downloadDocumentToCache(document: DocumentRecord): Promise<string> {
  const token = await getAccessToken();
  const localUri = `${FileSystem.cacheDirectory}${document.fileName}`;
  const result = await FileSystem.downloadAsync(`${API_BASE_URL}/documents/${document.id}/file`, localUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return result.uri;
}
