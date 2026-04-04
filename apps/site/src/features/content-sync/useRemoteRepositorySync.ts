import { useEffect } from 'react';

interface UseRemoteRepositorySyncOptions<TRemote, TSnapshot> {
  fetchRemote: () => Promise<TRemote>;
  applyRemote: (remote: TRemote) => TSnapshot;
  onSynced: (snapshot: TSnapshot) => void;
  onError?: (error: unknown) => void;
}

export function useRemoteRepositorySync<TRemote, TSnapshot>({
  fetchRemote,
  applyRemote,
  onSynced,
  onError,
}: UseRemoteRepositorySyncOptions<TRemote, TSnapshot>): void {
  useEffect(() => {
    let active = true;

    void fetchRemote()
      .then((remote) => {
        if (!active) return;
        const snapshot = applyRemote(remote);
        onSynced(snapshot);
      })
      .catch((error) => {
        if (!active) return;
        if (onError) onError(error);
      });

    return () => {
      active = false;
    };
  }, [applyRemote, fetchRemote, onError, onSynced]);
}
