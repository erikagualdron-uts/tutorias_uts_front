// @@iconify-code-gen
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useSyncDeviceLanguage } from '@/i18n';
import { useRestoreSession } from '@/store/useRestoreSession';
import { useAppFonts, usePalette } from '@/theme';

// Keep the splash until the fonts are ready (docs/Design.md, Typography).
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  const palette = usePalette();
  const [queryClient] = useState(() => new QueryClient());
  useRestoreSession();
  useSyncDeviceLanguage();

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.screen },
        }}
      >
        <Stack.Screen
          name="change-password"
          options={{ gestureEnabled: false }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
