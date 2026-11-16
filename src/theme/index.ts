import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import { RobotoMono_400Regular } from '@expo-google-fonts/roboto-mono';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, type Palette } from './colors';

export * from './tokens';
export type { Palette } from './colors';

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? darkPalette : lightPalette;
}

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    RobotoMono_400Regular,
  });
  return loaded;
}
