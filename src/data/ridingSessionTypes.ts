import type { RidingSessionType } from '../types/api';

export const RIDING_SESSION_TYPES: { value: RidingSessionType; label: string }[] = [
  { value: 'dressage', label: 'Dressage' },
  { value: 'osteo', label: 'Osteo' },
  { value: 'entrainement', label: 'Entrainement' },
  { value: 'autre', label: 'Autre' },
];

export function getRidingSessionTypeLabel(type: RidingSessionType): string {
  return RIDING_SESSION_TYPES.find((t) => t.value === type)?.label ?? type;
}
