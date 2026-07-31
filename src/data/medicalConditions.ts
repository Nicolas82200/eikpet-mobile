const DOG_CAT_CONDITIONS = [
  'Insuffisance renale chronique',
  'Insuffisance cardiaque',
  'Diabete',
  'Arthrose',
  'Dysplasie de la hanche',
  'Hypothyroidie',
  'Hyperthyroidie',
  'Epilepsie',
  'Maladie parodontale',
  'Cystite / calculs urinaires',
  'Otite chronique',
  'Allergie cutanee chronique',
  'Insuffisance hepatique',
] as const;

const HORSE_CONDITIONS = [
  'Fourbure',
  'Arthrose',
  'Souffle (RAO / asthme equin)',
  'Syndrome de Cushing (PPID)',
  'Boiterie chronique',
  'Coliques recidivantes',
  'Ulceres gastriques',
  'Dermite estivale',
] as const;

const CONDITIONS_BY_SPECIES: Record<string, readonly string[]> = {
  Chien: DOG_CAT_CONDITIONS,
  Chat: DOG_CAT_CONDITIONS,
  Cheval: HORSE_CONDITIONS,
};

export function getChronicConditionsForSpecies(species: string): readonly string[] {
  return CONDITIONS_BY_SPECIES[species] ?? DOG_CAT_CONDITIONS;
}
