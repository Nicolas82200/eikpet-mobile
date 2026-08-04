import { getAnimalWarnings } from './animalWarnings';
import type { HealthEntry, MedicalProfile } from '../types/api';

function makeVaccine(overrides: Partial<HealthEntry> = {}): HealthEntry {
  return {
    id: 1,
    animalId: 1,
    type: 'vaccin',
    customTypeLabel: null,
    scheduledDate: '2026-01-01',
    scheduledTime: null,
    status: 'fait',
    report: null,
    price: null,
    nextReminderDate: null,
    ...overrides,
  };
}

const completeProfile: Partial<MedicalProfile> = {
  allergies: 'Aucune allergie connue',
  bloodType: 'Inconnu',
  referringVetName: 'Pas de veto referent',
};

describe('getAnimalWarnings', () => {
  it("remonte toutes les alertes quand rien n'est renseigne", () => {
    const warnings = getAnimalWarnings(null, []);
    expect(warnings).toEqual([
      'Allergies non renseignees',
      'Groupe sanguin non renseigne',
      'Aucun veterinaire referent renseigne',
      'Aucun vaccin enregistre',
    ]);
  });

  it('ne remonte pas d alerte pour un champ explicitement marque "rien a signaler"', () => {
    const warnings = getAnimalWarnings(completeProfile, [makeVaccine()]);
    expect(warnings).toEqual([]);
  });

  it('signale un rappel de vaccin en retard', () => {
    const warnings = getAnimalWarnings(completeProfile, [
      makeVaccine({ nextReminderDate: '2000-01-01' }),
    ]);
    expect(warnings).toContain('Rappel de vaccin en retard');
  });

  it("ne signale pas de retard si le prochain rappel n'est pas encore passe", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const warnings = getAnimalWarnings(completeProfile, [
      makeVaccine({ nextReminderDate: future.toISOString().slice(0, 10) }),
    ]);
    expect(warnings).not.toContain('Rappel de vaccin en retard');
  });
});
