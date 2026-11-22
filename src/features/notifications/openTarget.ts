import type { Href } from 'expo-router';
import type { Role } from '@/api/types';

// Where a notice or a push leads: the module it is about (SC-007, one tap). Each role has its own
// screen for modules; a module that no longer exists is explained by that screen's error state.
// The casts are needed because the generated route types only learn the new routes when Expo restarts.
export function targetFor(role: Role, moduleId: string): Href {
  if (role === 'STUDENT') return { pathname: '/(student)/modules/[id]', params: { id: moduleId } } as Href;
  if (role === 'TEACHER') return '/(teacher)/schedule';
  return { pathname: '/(admin)/modules/[id]', params: { id: moduleId } } as Href;
}

const PQRS_DETAIL = {
  STUDENT: '/(student)/pqrs/[id]',
  TEACHER: '/(teacher)/pqrs/[id]',
  SUPERADMIN: '/(admin)/pqrs/[id]',
} as const;

// A PQRS notice opens that PQRS; a module notice opens its module; neither leads nowhere (spec 017).
export function noticeTarget(role: Role, notice: { moduleId?: string | null; pqrsId?: string | null }): Href | null {
  if (notice.pqrsId) return { pathname: PQRS_DETAIL[role], params: { id: notice.pqrsId } } as Href;
  return notice.moduleId ? targetFor(role, notice.moduleId) : null;
}

// The inbox of each role group (the bell leads here).
export const inboxRoute = (role: Role): Href =>
  (role === 'STUDENT' ? '/(student)/notifications' : role === 'TEACHER' ? '/(teacher)/notifications' : '/(admin)/notifications') as Href;
