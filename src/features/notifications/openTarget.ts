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

// The inbox of each role group (the bell leads here).
export const inboxRoute = (role: Role): Href =>
  (role === 'STUDENT' ? '/(student)/notifications' : role === 'TEACHER' ? '/(teacher)/notifications' : '/(admin)/notifications') as Href;
