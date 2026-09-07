/** 3.8 Seances : reserve aux chevaux (et poneys), cf. cahier des charges. */
export function isEquine(species: string): boolean {
  const normalized = normalizeSpecies(species);
  return normalized === 'cheval' || normalized === 'poney' || normalized === 'pony';
}

/** Insensible a la casse/aux espaces pour matcher les listes de suggestions (races, maladies, vaccins). */
export function normalizeSpecies(species: string): string {
  return species.trim().toLowerCase();
}
