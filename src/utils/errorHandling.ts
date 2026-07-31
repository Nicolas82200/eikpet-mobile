import { Alert } from 'react-native';
import { ApiError } from '../api/client';

export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    // fetch() rejette avec un TypeError generique en cas de probleme reseau
    return 'Impossible de contacter le serveur. Verifiez votre connexion.';
  }
  return fallback;
}

/** A passer a un .catch() pour les chargements de donnees : previent l'utilisateur au lieu d'echouer en silence. */
export function showLoadError(error: unknown): void {
  Alert.alert('Chargement impossible', getErrorMessage(error));
}

export function showError(error: unknown, title = 'Erreur'): void {
  Alert.alert(title, getErrorMessage(error));
}
