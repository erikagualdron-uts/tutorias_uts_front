import { useEffect } from 'react';
import { refreshSession } from '@/api/client';
import { loadRefreshToken } from './secureSession';
import { useSession } from './session';

// On app start: with a stored refresh token, renew it and enter; otherwise go to login.
export function useRestoreSession() {
  useEffect(() => {
    void (async () => {
      if (!(await loadRefreshToken()))
        return useSession.setState({ status: 'signedOut' });
      // Still loading here means the server was unreachable; keep the token and explain why.
      if (!(await refreshSession()))
        useSession.setState((state) =>
          state.status === 'loading'
            ? { status: 'signedOut', signOutReason: 'NETWORK' }
            : state,
        );
    })();
  }, []);
}
