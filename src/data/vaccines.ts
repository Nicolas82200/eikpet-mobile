import { normalizeSpecies } from '../utils/species';

const DOG_VACCINES = [
  'CHPPI (Carre, Hepatite, Parvovirose, Parainfluenza, Leptospirose)',
  'Rage',
  'Toux du chenil (Bordetella)',
  'Leishmaniose',
  'Piroplasmose (Babesiose)',
  'Herpesvirose canine',
  'Maladie de Lyme (Borreliose)',
] as const;

const CAT_VACCINES = [
  'Typhus (Panleucopenie feline)',
  'Coryza (Herpesvirose/Calicivirose)',
  'Leucose feline (FeLV)',
  'Rage',
  'Chlamydiose',
  'PIF (Peritonite Infectieuse Feline)',
  'Teigne (Microsporum canis)',
] as const;

const HORSE_VACCINES = [
  'Grippe equine',
  'Tetanos',
  'Rhinopneumonie (Herpesvirose equine)',
  'Rage',
  'Morve',
  'West Nile',
  'Gourme (Streptococcus equi)',
  'Encephalomyelite (EEE/WEE)',
] as const;

// NAC (Nouveaux Animaux de Compagnie)
const RABBIT_VACCINES = [
  'Myxomatose',
  'VHD (maladie hemorragique virale) souche classique',
  'VHD2 (variant RHDV2)',
] as const;

const FERRET_VACCINES = ['Rage', 'Maladie de Carre (moquillon)'] as const;

const GENERIC_VACCINES = ['Rage', 'Tetanos'] as const;

const VACCINES_BY_SPECIES: Record<string, readonly string[]> = {
  chien: DOG_VACCINES,
  chat: CAT_VACCINES,
  cheval: HORSE_VACCINES,
  poney: HORSE_VACCINES,
  lapin: RABBIT_VACCINES,
  furet: FERRET_VACCINES,
};

export function getVaccinesForSpecies(species: string): readonly string[] {
  return VACCINES_BY_SPECIES[normalizeSpecies(species)] ?? GENERIC_VACCINES;
}
