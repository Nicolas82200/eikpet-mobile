import type { HealthEntryType } from '../types/api';

export const HEALTH_ENTRY_TYPES: { value: HealthEntryType; label: string; color: string }[] = [
  { value: 'vaccin', label: 'Vaccin', color: '#2563EB' },
  { value: 'vermifuge', label: 'Vermifuge', color: '#7C3AED' },
  { value: 'rdv_veto', label: 'Rendez-vous veto', color: '#DC2626' },
  { value: 'osteo', label: 'Osteopathie', color: '#EA580C' },
  { value: 'dentiste_equin', label: 'Dentiste equin', color: '#0D9488' },
  { value: 'marechal', label: 'Marechal-ferrant', color: '#16A34A' },
  { value: 'autre', label: 'Autre', color: '#78716C' },
];

export function getHealthEntryTypeLabel(type: HealthEntryType): string {
  return HEALTH_ENTRY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function getHealthEntryTypeColor(type: HealthEntryType): string {
  return HEALTH_ENTRY_TYPES.find((t) => t.value === type)?.color ?? '#78716C';
}
