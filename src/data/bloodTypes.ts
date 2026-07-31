const DOG_BLOOD_TYPES = [
  'DEA 1.1 positif',
  'DEA 1.1 negatif',
  'DEA 1.2',
  'DEA 3',
  'DEA 4',
  'DEA 5',
  'DEA 7',
] as const;

const CAT_BLOOD_TYPES = ['A', 'B', 'AB'] as const;

const HORSE_BLOOD_TYPES = ['A', 'C', 'D', 'K', 'P', 'Q', 'U'] as const;

const BLOOD_TYPES_BY_SPECIES: Record<string, readonly string[]> = {
  Chien: DOG_BLOOD_TYPES,
  Chat: CAT_BLOOD_TYPES,
  Cheval: HORSE_BLOOD_TYPES,
};

export function getBloodTypesForSpecies(species: string): readonly string[] {
  return BLOOD_TYPES_BY_SPECIES[species] ?? [];
}
