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
  'Sable',
  'Noir et feu',
  'Noir et blanc',
  'Marron et blanc',
  'Tricolore',
  'Bringe',
  'Merle',
  'Merle bleu',
  'Arlequin',
  'Tachete',
  'Golden / Dore',
  'Fauve charbonne',
  'Gris bleu',
] as const;

const CAT_COLORS = [
  'Noir',
  'Blanc',
  'Roux',
  'Gris (bleu)',
  'Creme',
  'Lilas',
  'Chocolat',
  'Cannelle',
  'Fauve (fawn)',
  'Ecaille de tortue',
  'Ecaille dilue (bleu-creme)',
  'Tigre (tabby brun)',
  'Tabby argente',
  'Tabby roux',
  'Colourpoint (siamois)',
  'Bicolore',
  'Tricolore (calico)',
  'Smoke (fume)',
  'Chinchilla',
  'Noir et blanc',
] as const;

const HORSE_COLORS = [
  'Alezan',
  'Alezan brule',
  'Bai',
  'Bai brun',
  'Bai cerise',
  'Noir',
  'Noir pangare',
  'Gris',
  'Gris pommele',
  'Gris fer',
  'Palomino',
  'Isabelle',
  'Pie (noir et blanc)',
  'Pie (alezan et blanc)',
  'Aubere',
  'Louvet',
  'Rouan',
  'Rouan bai',
  'Rubican',
  'Cafe au lait',
  'Cremello',
  'Perlino',
  'Souris',
  'Truite',
] as const;

const GENERIC_COLORS = [
  'Noir',
  'Blanc',
  'Marron',
  'Gris',
  'Roux',
  'Creme',
  'Fauve',
  'Bicolore',
  'Tricolore',
  'Tachete',
] as const;

const COLORS_BY_SPECIES: Record<string, readonly string[]> = {
  Chien: DOG_COLORS,
  Chat: CAT_COLORS,
  Cheval: HORSE_COLORS,
};

export function getColorsForSpecies(species: string): readonly string[] {
  return COLORS_BY_SPECIES[species] ?? GENERIC_COLORS;
}
