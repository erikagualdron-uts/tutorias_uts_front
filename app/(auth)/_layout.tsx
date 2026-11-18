import { Redirect, Stack, type Href } from 'expo-router';
import { usePalette } from '@/theme';
import { useSession } from '@/store/session';
import { routeFor } from '@/features/auth/routing';

export default function AuthLayout() {
  const palette = usePalette();
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);

  // A signed-in user never stays on the sign-in screens.
  if (status === 'signedIn')
    return <Redirect href={routeFor({ status, user }) as Href} />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.screen },
      }}
    />
  );
}
