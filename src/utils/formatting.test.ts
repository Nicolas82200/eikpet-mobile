import { formatTime } from './formatting';

describe('formatTime', () => {
  it('tronque les secondes du format HH:MM:SS renvoye par MySQL', () => {
    expect(formatTime('08:30:00')).toBe('08:30');
  });

  it('renvoie une chaine vide pour une valeur absente', () => {
    expect(formatTime(null)).toBe('');
    expect(formatTime(undefined)).toBe('');
    expect(formatTime('')).toBe('');
  });
});
