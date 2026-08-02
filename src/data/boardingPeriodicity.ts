import type { BoardingPeriodicity } from '../types/api';

export const BOARDING_PERIODICITIES: { value: BoardingPeriodicity; label: string }[] = [
  { value: 'unique', label: 'Unique' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'annuel', label: 'Annuel' },
];

export function getPeriodicityLabel(periodicity: BoardingPeriodicity): string {
  return BOARDING_PERIODICITIES.find((p) => p.value === periodicity)?.label ?? periodicity;
}
