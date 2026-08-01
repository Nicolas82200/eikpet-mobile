import { useCallback, useState } from 'react';

/**
 * Fournit le tiraillement "pull to refresh" pour une liste, en reutilisant la meme
 * fonction de chargement que celle appelee automatiquement au focus de l'ecran.
 * loadFn doit gerer ses propres erreurs (ex: via .catch(showLoadError)) pour ne
 * jamais rejeter, sinon le spinner de refresh resterait bloque.
 */
export function useRefreshable(loadFn: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const trigger = useCallback(() => {
    loadFn().catch(() => undefined);
  }, [loadFn]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFn();
    } finally {
      setRefreshing(false);
    }
  }, [loadFn]);

  return { refreshing, trigger, onRefresh };
}
