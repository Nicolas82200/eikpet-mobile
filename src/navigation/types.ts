export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Households: undefined;
  Animals: { householdId: number; householdName: string };
  AnimalDetail: { animalId: number; animalName: string; householdId: number };
  MedicalProfile: { animalId: number; animalName: string; species: string };
  HealthEntries: { animalId: number; animalName: string; species: string };
  Calendar: { householdId: number; householdName: string };
  Documents: { householdId: number; animalId?: number };
  AppointmentFollowUp: { animalId: number; entryId: number };
  HouseholdMembers: { householdId: number; householdName: string; inviteCode: string; isOwner: boolean };
};
