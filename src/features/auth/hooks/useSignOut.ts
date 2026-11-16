import { api } from '@/api/client';
import { useSession } from '@/store/session';

// Closes this device's session on the server, then clears the local one even if the call fails.
export function useSignOut() {
  return async () => {
    await api<void>('/auth/logout', { method: 'POST' }).catch(() => undefined);
    await useSession.getState().signOut();
  };
}
