const DOG_CAT_DEWORMERS = [
  'Vermifuge interne (vers ronds/plats)',
  'Vermifuge externe (puces/tiques)',
  'Vermifuge combine interne + externe',
  'Traitement anti-puces',
  'Traitement anti-tiques',
] as const;

const HORSE_DEWORMERS = [
  'Vermifuge a large spectre',
  'Traitement anti-strongles',
  'Traitement anti-tenias',
  'Traitement anti-gastrophiles (bots)',
] as const;

const DEWORMERS_BY_SPECIES: Record<string, readonly string[]> = {
  Chien: DOG_CAT_DEWORMERS,
  Chat: DOG_CAT_DEWORMERS,
  Cheval: HORSE_DEWORMERS,
};

export function getDewormersForSpecies(species: string): readonly string[] {
  return DEWORMERS_BY_SPECIES[species] ?? [];
}
