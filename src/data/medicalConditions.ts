const DOG_CONDITIONS = [
  'Insuffisance renale chronique',
  'Insuffisance cardiaque',
  'Souffle cardiaque / maladie valvulaire',
  'Diabete',
  'Arthrose',
  'Dysplasie de la hanche',
  'Dysplasie du coude',
  'Hypothyroidie',
  'Hyperthyroidie',
  "Maladie de Cushing (hyperadrenocorticisme)",
  'Epilepsie',
  'Maladie parodontale',
  'Cystite / calculs urinaires',
  'Otite chronique',
  'Allergie cutanee chronique (dermatite atopique)',
  'Insuffisance hepatique',
  'Trachee affaissee',
  'Syndrome brachycephale',
  'Ehrlichiose chronique',
  'Leishmaniose',
] as const;

const CAT_CONDITIONS = [
  'Insuffisance renale chronique',
  'Cardiomyopathie hypertrophique',
  'Diabete',
  'Hyperthyroidie',
  'Arthrose',
  'Coryza chronique (herpesvirus/calicivirus)',
  'FIV (immunodeficience feline)',
  'FeLV (leucose feline)',
  'PIF (peritonite infectieuse feline)',
  'Cystite idiopathique / calculs urinaires',
  'Maladie parodontale / gingivostomatite',
  'Asthme felin',
  'Insuffisance hepatique',
  'Polykystose renale',
] as const;

const HORSE_CONDITIONS = [
  'Fourbure',
  'Arthrose',
  'Souffle (RAO / asthme equin)',
  'Syndrome de Cushing (PPID)',
  'Syndrome metabolique equin (SME)',
  'Boiterie chronique',
  'Coliques recidivantes',
  'Ulceres gastriques',
  'Dermite estivale',
  'Piroplasmose a Babesia caballi',
  'Piroplasmose a Theileria equi',
  'Anemie infectieuse equine',
  'Myopathie atypique',
  'Uveite recidivante (fluxion periodique)',
  'Naviculaire',
  'Emphyseme',
] as const;

const CONDITIONS_BY_SPECIES: Record<string, readonly string[]> = {
  Chien: DOG_CONDITIONS,
  Chat: CAT_CONDITIONS,
  Cheval: HORSE_CONDITIONS,
};

export function getChronicConditionsForSpecies(species: string): readonly string[] {
  return CONDITIONS_BY_SPECIES[species] ?? [...DOG_CONDITIONS, ...CAT_CONDITIONS];
}
