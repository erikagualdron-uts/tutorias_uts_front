import { create } from 'zustand';
import type { AuthTokens, UserSummary } from '@/api/types';
import { clearRefreshToken, saveRefreshToken } from './secureSession';

type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
  status: SessionStatus;
  user: UserSummary | null;
  accessToken: string | null;
  // Why the session ended (an API error code) so the login screen can explain it.
  signOutReason: string | null;
  signIn: (tokens: AuthTokens) => Promise<void>;
  setUser: (user: UserSummary) => void;
  setAccessToken: (token: string) => void;
  signOut: (reason?: string) => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  signOutReason: null,
  signIn: async ({ accessToken, refreshToken, user }) => {
    await saveRefreshToken(refreshToken);
    set({ status: 'signedIn', user, accessToken, signOutReason: null });
  },
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  signOut: async (reason) => {
    await clearRefreshToken();
    set({
      status: 'signedOut',
      user: null,
      accessToken: null,
      signOutReason: reason ?? null,
    });
  },
}));
