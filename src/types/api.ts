// Types partages avec le backend (backend/src/**/*.repository.ts).
// Pas de generation automatique (pas d'ORM) : a garder synchronise a la main.

export interface Household {
  id: number;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface HouseholdMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'member';
}

export type AnimalSex = 'male' | 'femelle' | 'inconnu';

export interface Animal {
  id: number;
  householdId: number;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  sex: AnimalSex;
  birthDate: string | null;
  sterilized: boolean;
  microchipNumber: string | null;
  currentWeightKg: number | null;
  photoUrl: string | null;
  age: { years: number; months: number } | null;
}

export interface MedicalProfile {
  animalId: number;
  chronicConditions: string | null;
  allergies: string | null;
  dietaryNeeds: string | null;
  behavioralNotes: string | null;
  bloodType: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  insuranceCoverageLimit: number | null;
  insuranceDeductible: number | null;
  referringVetName: string | null;
  referringVetPhone: string | null;
}

export interface Treatment {
  id: number;
  animalId: number;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  /** Heures de prise separees par des virgules, ex: "08:00,13:00,20:00". */
  reminderTimes: string | null;
  notes: string | null;
}

export interface SurgicalHistoryEntry {
  id: number;
  animalId: number;
  procedureName: string;
  performedOn: string | null;
  notes: string | null;
}

export type HealthEntryType =
  | 'vaccin'
  | 'vermifuge'
  | 'rdv_veto'
  | 'osteo'
  | 'dentiste_equin'
  | 'marechal'
  | 'autre';

export type HealthEntryStatus = 'prevu' | 'fait';

export interface HealthEntry {
  id: number;
  animalId: number;
  type: HealthEntryType;
  customTypeLabel: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  status: HealthEntryStatus;
  report: string | null;
  price: number | null;
  nextReminderDate: string | null;
}

export interface CalendarEntry extends HealthEntry {
  animalName: string;
}

export type DocumentCategory = 'ordonnance' | 'analyse' | 'certificat_vaccination' | 'autre';

export interface DocumentRecord {
  id: number;
  householdId: number;
  animalId: number | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: DocumentCategory;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type SubscriptionPlanStatus = 'active' | 'grace_period' | 'canceled' | 'expired';

export interface SubscriptionStatus {
  isPremium: boolean;
  status: SubscriptionPlanStatus;
  productId: string | null;
  currentPeriodEnd: string | null;
}

export type ProviderType = 'veto' | 'osteo' | 'marechal' | 'pension' | 'toiletteur' | 'educateur' | 'autre';

export interface Provider {
  id: number;
  householdId: number;
  type: ProviderType;
  customTypeLabel: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export type BoardingPeriodicity = 'unique' | 'hebdomadaire' | 'mensuel' | 'annuel';
export type BoardingStatus = 'regle' | 'non_regle';

export interface HouseholdBudget {
  householdId: number;
  total: number;
  byAnimal: { animalId: number; animalName: string; total: number }[];
}

export interface AnimalBudget {
  animalId: number;
  healthTotal: number;
  boardingTotal: number;
  ridingSessionsTotal: number;
  total: number;
  byCategory: { type: HealthEntryType; total: number }[];
}

export interface BoardingEntry {
  id: number;
  animalId: number;
  name: string;
  address: string | null;
  price: number | null;
  periodicity: BoardingPeriodicity;
  dueDate: string;
  status: BoardingStatus;
  notes: string | null;
}

export type RidingSessionType = 'dressage' | 'osteo' | 'entrainement' | 'autre';
export type RidingSessionStatus = 'prevu' | 'fait';

export interface RidingSession {
  id: number;
  animalId: number;
  type: RidingSessionType;
  customTypeLabel: string | null;
  scheduledDate: string;
  status: RidingSessionStatus;
  report: string | null;
  price: number | null;
}

export interface VaccinationScheduleStep {
  label: string;
  targetDate: string;
}

export interface WeightEntry {
  id: number;
  animalId: number;
  weightKg: number;
  recordedDate: string;
  notes: string | null;
}
