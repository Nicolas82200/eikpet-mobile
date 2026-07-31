const COMMON_PROCEDURES = [
  'Sterilisation / Castration',
  'Extraction dentaire',
  'Detartrage',
  'Ablation de tumeur',
  'Cesarienne',
  'Chirurgie orthopedique',
  'Amputation',
  'Ablation de corps etranger',
  'Torsion d\'estomac (gastropexie)',
  'Ablation de la rate',
  'Chirurgie oculaire',
  'Chirurgie des tissus mous',
] as const;

const DOG_EXTRA_PROCEDURES = ['Ablation des ergots', 'Chirurgie ligament croise'] as const;
const HORSE_EXTRA_PROCEDURES = ['Coliques (chirurgie)', 'Castration (hongre)', 'Parage / soins de pieds'] as const;

const PROCEDURES_BY_SPECIES: Record<string, readonly string[]> = {
  Chien: [...COMMON_PROCEDURES, ...DOG_EXTRA_PROCEDURES],
  Chat: COMMON_PROCEDURES,
  Cheval: [...COMMON_PROCEDURES, ...HORSE_EXTRA_PROCEDURES],
};

export function getProceduresForSpecies(species: string): readonly string[] {
  return PROCEDURES_BY_SPECIES[species] ?? COMMON_PROCEDURES;
}
