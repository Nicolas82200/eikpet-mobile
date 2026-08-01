export type FieldState = 'empty' | 'none' | 'filled';

/** Distingue un champ jamais renseigne d'un champ explicitement marque "Aucun(e) connu(e)". */
export function getFieldState(value: string | null | undefined, noneLabel: string): FieldState {
  if (!value) return 'empty';
  if (value === noneLabel) return 'none';
  return 'filled';
}
