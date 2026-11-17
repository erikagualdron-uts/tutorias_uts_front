import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { FONT_LOAD_TIMEOUT_MS, fontFiles } from './fonts';
import { darkPalette, lightPalette, type Palette } from './colors';

export * from './tokens';
export type { Palette } from './colors';

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? darkPalette : lightPalette;
}

// True when the fonts are ready, failed to load, or took longer than the timeout,
// so the app never stays blocked on the splash (FR-007).
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(fontFiles);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);
  return loaded || error !== null || timedOut;
}
