export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type AppStackParamList = {
  Households: undefined;
  Animals: { householdId: number; householdName: string };
  AnimalDetail: { animalId: number; animalName: string; householdId: number };
  MedicalProfile: { animalId: number; animalName: string; species: string };
  HealthEntries: { animalId: number; animalName: string; species: string };
  Calendar: { householdId: number; householdName: string };
  Documents: { householdId: number; animalId?: number };
  Providers: { householdId: number; householdName: string };
  Boardings: { animalId: number; animalName: string };
  Reports: { animalId: number; animalName: string };
  Budget: { householdId: number; householdName: string };
  AnimalBudget: { animalId: number; animalName: string };
  RidingSessions: { animalId: number; animalName: string };
  EmergencySheet: { animalId: number; animalName: string };
  ProvidersMap: { householdId: number; householdName: string };
  AppointmentFollowUp: { animalId: number; entryId: number };
  HouseholdMembers: { householdId: number; householdName: string; inviteCode: string; isOwner: boolean };
  Account: undefined;
  Paywall: undefined;
  PracticalInfo: undefined;
};
