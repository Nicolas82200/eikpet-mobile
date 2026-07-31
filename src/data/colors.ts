// Robes/couleurs courantes par espece. Pas de referentiel API standardise pour ca,
// liste statique avec repli en saisie libre dans le picker.

const DOG_COLORS = [
  'Noir',
  'Blanc',
  'Marron / Chocolat',
  'Fauve',
  'Roux',
  'Gris',
  'Creme',
  'Noir et feu',
  'Tricolore',
  'Bringe',
  'Merle',
  'Tachete',
] as const;

const CAT_COLORS = [
  'Noir',
  'Blanc',
  'Roux',
  'Gris (bleu)',
  'Creme',
  'Ecaille de tortue',
  'Tigre (tabby)',
  'Colourpoint (siamois)',
  'Tricolore (calico)',
  'Chocolat',
  'Lilas',
] as const;

const HORSE_COLORS = [
  'Alezan',
  'Bai',
  'Noir',
  'Gris',
  'Palomino',
  'Isabelle',
  'Pie',
  'Aubere',
  'Louvet',
  'Rouan',
  'Rubican',
  'Cafe au lait',
  'Cremello',
] as const;

const GENERIC_COLORS = ['Noir', 'Blanc', 'Marron', 'Gris', 'Roux', 'Creme', 'Tricolore', 'Tachete'] as const;

const COLORS_BY_SPECIES: Record<string, readonly string[]> = {
  Chien: DOG_COLORS,
  Chat: CAT_COLORS,
  Cheval: HORSE_COLORS,
};

export function getColorsForSpecies(species: string): readonly string[] {
  return COLORS_BY_SPECIES[species] ?? GENERIC_COLORS;
}
