import { Stack } from 'expo-router';
import { usePalette } from '@/theme';

export default function StudentPqrsLayout() {
  const palette = usePalette();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.screen },
      }}
    />
  );
}
