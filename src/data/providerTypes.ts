import type { ProviderType } from '../types/api';

export const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: 'veto', label: 'Veto' },
  { value: 'osteo', label: 'Osteo' },
  { value: 'marechal', label: 'Marechal-ferrant' },
  { value: 'pension', label: 'Pension' },
  { value: 'toiletteur', label: 'Toiletteur' },
  { value: 'educateur', label: 'Educateur' },
  { value: 'autre', label: 'Autre' },
];

export function getProviderTypeLabel(type: ProviderType): string {
  return PROVIDER_TYPES.find((t) => t.value === type)?.label ?? type;
}
