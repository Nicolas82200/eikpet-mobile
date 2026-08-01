import type { HealthEntry, MedicalProfile } from '../types/api';
import { NONE_LABELS } from '../data/medicalFieldDefaults';
import { getFieldState } from './fieldState';

/**
 * Alertes sur les infos critiques en cas d'urgence : utile pour la future fiche
 * d'urgence (V4 du cahier des charges) et pour inciter a completer le dossier.
 * On ne remonte que ce qui manque vraiment (pas "empty"), un champ marque
 * explicitement "Aucun(e) connu(e)" ne declenche pas d'alerte.
 */
export function getAnimalWarnings(
  profile: Partial<MedicalProfile> | null,
  healthEntries: HealthEntry[],
): string[] {
  const warnings: string[] = [];

  if (!profile || getFieldState(profile.allergies, NONE_LABELS.allergies) === 'empty') {
    warnings.push('Allergies non renseignees');
  }
  if (!profile || getFieldState(profile.bloodType, NONE_LABELS.bloodType) === 'empty') {
    warnings.push('Groupe sanguin non renseigne');
  }
  if (!profile || getFieldState(profile.referringVetName, NONE_LABELS.referringVetName) === 'empty') {
    warnings.push('Aucun veterinaire referent renseigne');
  }

  const vaccines = healthEntries.filter((e) => e.type === 'vaccin');
  if (vaccines.length === 0) {
    warnings.push('Aucun vaccin enregistre');
  } else {
    const today = new Date();
    const hasOverdueReminder = vaccines.some(
      (v) => v.nextReminderDate && new Date(v.nextReminderDate) < today,
    );
    if (hasOverdueReminder) {
      warnings.push('Rappel de vaccin en retard');
    }
  }

  return warnings;
}
