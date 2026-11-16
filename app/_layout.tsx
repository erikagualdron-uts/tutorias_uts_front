import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useSyncDeviceLanguage } from '@/i18n';
import { useRestoreSession } from '@/store/useRestoreSession';
import { useAppFonts } from '@/theme';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  const [queryClient] = useState(() => new QueryClient());
  useRestoreSession();
  useSyncDeviceLanguage();

  if (!fontsLoaded) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="change-password"
          options={{ gestureEnabled: false }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
