import { Redirect, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useSession } from '@/store/session';
import { routeFor } from './routing';

interface RouteGateProps {
  // The route this layout owns; any other session state is sent to its own place.
  expected: string;
  children: ReactNode;
}

// Navigation guard only; the API enforces the real permissions.
export function RouteGate({ expected, children }: RouteGateProps) {
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);

  if (status === 'loading') return <LoadingScreen />;
  const target = routeFor({ status, user });
  return target === expected ? (
    <>{children}</>
  ) : (
    <Redirect href={target as Href} />
  );
}
