import { Redirect, type Href } from 'expo-router';
import { LoadingScreen } from '@/components/LoadingScreen';
import { routeFor } from '@/features/auth/routing';
import { useSession } from '@/store/session';

export default function Index() {
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);

  if (status === 'loading') return <LoadingScreen />;
  return <Redirect href={routeFor({ status, user }) as Href} />;
}
