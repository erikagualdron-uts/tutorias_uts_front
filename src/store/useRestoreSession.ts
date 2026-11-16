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
      // refreshSession closes the session itself when the server rejects the token.
      if (!(await refreshSession()))
        useSession.setState({ status: 'signedOut' });
    })();
  }, []);
}
