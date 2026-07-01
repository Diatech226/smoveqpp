import { useEffect, useState } from 'react';

interface UseRemoteRepositorySyncOptions<TRemote, TSnapshot> {
  fetchRemote: () => Promise<TRemote>;
  applyRemote: (remote: TRemote) => TSnapshot;
  onSynced: (snapshot: TSnapshot) => void;
  onError?: (error: unknown) => void;
}

export interface RemoteRepositorySyncState {
  isLoading: boolean;
  error: unknown;
}

export function useRemoteRepositorySync<TRemote, TSnapshot>({
  fetchRemote,
  applyRemote,
  onSynced,
  onError,
}: UseRemoteRepositorySyncOptions<TRemote, TSnapshot>): RemoteRepositorySyncState {
  const [state, setState] = useState<RemoteRepositorySyncState>({ isLoading: true, error: null });

  useEffect(() => {
    let active = true;

    setState({ isLoading: true, error: null });

    void fetchRemote()
      .then((remote) => {
        if (!active) return;
        const snapshot = applyRemote(remote);
        onSynced(snapshot);
        setState({ isLoading: false, error: null });
      })
      .catch((error) => {
        if (!active) return;
        if (onError) onError(error);
        setState({ isLoading: false, error });
      });

    return () => {
      active = false;
    };
  }, [applyRemote, fetchRemote, onError, onSynced]);

  return state;
}
