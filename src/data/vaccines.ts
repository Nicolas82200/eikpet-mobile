const DOG_VACCINES = [
  'CHPPI (Carre, Hepatite, Parvovirose, Parainfluenza, Leptospirose)',
  'Rage',
  'Toux du chenil (Bordetella)',
  'Leishmaniose',
  'Piroplasmose (Babesiose)',
  'Herpesvirose canine',
] as const;

const CAT_VACCINES = [
  'Typhus (Panleucopenie feline)',
  'Coryza (Herpesvirose/Calicivirose)',
  'Leucose feline (FeLV)',
  'Rage',
  'Chlamydiose',
  'PIF (Peritonite Infectieuse Feline)',
] as const;

const HORSE_VACCINES = [
  'Grippe equine',
  'Tetanos',
  'Rhinopneumonie (Herpesvirose equine)',
  'Rage',
  'Morve',
  'West Nile',
] as const;

const GENERIC_VACCINES = ['Rage', 'Tetanos'] as const;

const VACCINES_BY_SPECIES: Record<string, readonly string[]> = {
  Chien: DOG_VACCINES,
  Chat: CAT_VACCINES,
  Cheval: HORSE_VACCINES,
};

export function getVaccinesForSpecies(species: string): readonly string[] {
  return VACCINES_BY_SPECIES[species] ?? GENERIC_VACCINES;
}
