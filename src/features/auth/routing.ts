import type { Role, UserSummary } from '@/api/types';

export type SessionView = {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: UserSummary | null;
};

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/(student)',
  TEACHER: '/(teacher)',
  SUPERADMIN: '/(admin)',
};

// Where the app must be for this session: login, forced password change or the tabs of the role.
export function routeFor({ status, user }: SessionView): string {
  if (status !== 'signedIn' || !user) return '/login';
  if (user.mustChangePassword) return '/change-password';
  return ROLE_HOME[user.role];
}
