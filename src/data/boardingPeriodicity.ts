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

/** 0 = lundi ... 6 = dimanche, aligne sur le backend. */
export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 0, label: 'Lundi' },
  { value: 1, label: 'Mardi' },
  { value: 2, label: 'Mercredi' },
  { value: 3, label: 'Jeudi' },
  { value: 4, label: 'Vendredi' },
  { value: 5, label: 'Samedi' },
  { value: 6, label: 'Dimanche' },
];

export function getWeekdayLabel(dayOfWeek: number): string {
  return WEEKDAYS.find((d) => d.value === dayOfWeek)?.label ?? String(dayOfWeek);
}
