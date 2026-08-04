/** 3.8 Seances : reserve aux chevaux (et poneys), cf. cahier des charges. */
export function isEquine(species: string): boolean {
  const normalized = species.trim().toLowerCase();
  return normalized === 'cheval' || normalized === 'poney' || normalized === 'pony';
}
