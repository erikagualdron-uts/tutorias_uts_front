import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { routeFor } from '@/features/auth/routing';
import { useSession } from '@/store/session';

export default function Index() {
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={routeFor({ status, user }) as Href} />;
}
