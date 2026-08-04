import { getFieldState } from './fieldState';

describe('getFieldState', () => {
  it('renvoie "empty" pour une valeur nulle, undefined ou vide', () => {
    expect(getFieldState(null, 'Aucune allergie connue')).toBe('empty');
    expect(getFieldState(undefined, 'Aucune allergie connue')).toBe('empty');
    expect(getFieldState('', 'Aucune allergie connue')).toBe('empty');
  });

  it('renvoie "none" quand la valeur correspond au libelle "rien a signaler"', () => {
    expect(getFieldState('Aucune allergie connue', 'Aucune allergie connue')).toBe('none');
  });

  it('renvoie "filled" pour toute autre valeur renseignee', () => {
    expect(getFieldState('Pollen', 'Aucune allergie connue')).toBe('filled');
  });
});
