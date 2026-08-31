import { isPlanLimitError, getErrorMessage } from './errorHandling';
import { ApiError } from '../api/client';

describe('isPlanLimitError', () => {
  it('reconnait une ApiError dont le errorCode commence par PLAN_LIMIT_', () => {
    expect(isPlanLimitError(new ApiError(403, 'Limite atteinte', 'PLAN_LIMIT_ANIMAL'))).toBe(true);
  });

  it("renvoie false pour une ApiError metier sans lien avec le plan", () => {
    expect(isPlanLimitError(new ApiError(404, 'Introuvable', 'NOT_FOUND'))).toBe(false);
    expect(isPlanLimitError(new ApiError(500, 'Erreur serveur'))).toBe(false);
  });

  it('renvoie false pour une erreur qui n est pas une ApiError', () => {
    expect(isPlanLimitError(new Error('boom'))).toBe(false);
    expect(isPlanLimitError('boom')).toBe(false);
    expect(isPlanLimitError(null)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('renvoie le message de l ApiError tel quel', () => {
    expect(getErrorMessage(new ApiError(400, 'Requete invalide'))).toBe('Requete invalide');
  });

  it('renvoie un message reseau explicite pour un TypeError (fetch echoue)', () => {
    expect(getErrorMessage(new TypeError('Network request failed'))).toBe(
      'Impossible de contacter le serveur. Verifiez votre connexion.',
    );
  });

  it('inclut le detail technique pour une erreur JS inattendue', () => {
    expect(getErrorMessage(new RangeError('bad range'), 'Oups')).toBe('Oups (RangeError: bad range)');
  });

  it('renvoie le message par defaut pour une valeur non-Error', () => {
    expect(getErrorMessage('boom', 'Oups')).toBe('Oups');
  });
});
