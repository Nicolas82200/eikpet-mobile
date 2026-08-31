import { isEquine } from './species';

describe('isEquine', () => {
  it('reconnait chevaux et poneys, insensible a la casse et aux espaces', () => {
    expect(isEquine('Cheval')).toBe(true);
    expect(isEquine('  cheval  ')).toBe(true);
    expect(isEquine('Poney')).toBe(true);
    expect(isEquine('PONY')).toBe(true);
  });

  it('renvoie false pour les autres especes', () => {
    expect(isEquine('Chien')).toBe(false);
    expect(isEquine('Chat')).toBe(false);
    expect(isEquine('')).toBe(false);
  });
});
