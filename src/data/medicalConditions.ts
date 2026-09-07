import { normalizeSpecies } from '../utils/species';

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

// NAC (Nouveaux Animaux de Compagnie)
const RABBIT_CONDITIONS = [
  'Maladie dentaire (malocclusion, pousse excessive)',
  'Stase digestive',
  'Coccidiose',
  'Myxomatose',
  'VHD (maladie hemorragique virale)',
  'Pododermatite (mal de pattes)',
  'Encephalitozoonose (E. cuniculi)',
  'Abces sous-cutane',
  'Teigne',
  'Gale des oreilles (otacariose)',
] as const;

const FERRET_CONDITIONS = [
  'Insulinome',
  'Maladie surrenalienne (hyperadrenocorticisme)',
  'Lymphome',
  'Maladie aleoutienne du vison (ADV)',
  'Grippe (transmissible depuis l\'humain)',
  'Cardiomyopathie dilatee',
] as const;

const RODENT_CONDITIONS = [
  'Maladie dentaire (malocclusion)',
  'Infection respiratoire',
  'Tumeur mammaire',
  'Diarrhee / entero-toxemie',
  'Teigne',
  'Acariose (gale)',
  'Deficit en vitamine C (cochon d\'Inde)',
] as const;

const BIRD_CONDITIONS = [
  'Maladie du bec et des plumes (PBFD)',
  'Chlamydiose aviaire (psittacose)',
  'Megabacteriose (Macrorhabdus ornithogaster)',
  'Carence en vitamine A',
  'Obesite / lipidose hepatique',
  'Ponte chronique / retention d\'oeuf',
  'Aspergillose',
] as const;

const REPTILE_CONDITIONS = [
  'Maladie osseuse metabolique (carence Ca/vitamine D3)',
  'Stomatite infectieuse (pourriture de bouche)',
  'Parasites internes (vers, coccidies)',
  'Abces',
  'Retention d\'oeuf / dystocie',
  'Brulures / mauvaise thermoregulation',
  'Rhinite / infection respiratoire',
] as const;

const NAC_CONDITIONS = [
  ...RABBIT_CONDITIONS,
  ...FERRET_CONDITIONS,
  ...RODENT_CONDITIONS,
  ...BIRD_CONDITIONS,
  ...REPTILE_CONDITIONS,
] as const;

const CONDITIONS_BY_SPECIES: Record<string, readonly string[]> = {
  chien: DOG_CONDITIONS,
  chat: CAT_CONDITIONS,
  cheval: HORSE_CONDITIONS,
  poney: HORSE_CONDITIONS,
  lapin: RABBIT_CONDITIONS,
  furet: FERRET_CONDITIONS,
  hamster: RODENT_CONDITIONS,
  rat: RODENT_CONDITIONS,
  souris: RODENT_CONDITIONS,
  'cochon d\'inde': RODENT_CONDITIONS,
  cobaye: RODENT_CONDITIONS,
  chinchilla: RODENT_CONDITIONS,
  gerbille: RODENT_CONDITIONS,
  oiseau: BIRD_CONDITIONS,
  perruche: BIRD_CONDITIONS,
  perroquet: BIRD_CONDITIONS,
  canari: BIRD_CONDITIONS,
  tortue: REPTILE_CONDITIONS,
  reptile: REPTILE_CONDITIONS,
  gecko: REPTILE_CONDITIONS,
  serpent: REPTILE_CONDITIONS,
  iguane: REPTILE_CONDITIONS,
  nac: NAC_CONDITIONS,
};

export function getChronicConditionsForSpecies(species: string): readonly string[] {
  return CONDITIONS_BY_SPECIES[normalizeSpecies(species)] ?? NAC_CONDITIONS;
}
