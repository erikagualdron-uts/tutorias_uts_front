import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { FONT_LOAD_TIMEOUT_MS, fontFiles } from './fonts';
import { darkPalette, lightPalette, type Palette } from './colors';
import { shadows } from './tokens';

export * from './tokens';
export type { Palette } from './colors';

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? darkPalette : lightPalette;
}

// Elevation levels with the shadow color of the current mode (deep green in light, black in dark).
export function useShadows() {
  const { shadow } = usePalette();
  return {
    level1: { ...shadows.level1, shadowColor: shadow },
    level2: { ...shadows.level2, shadowColor: shadow },
    level3: { ...shadows.level3, shadowColor: shadow },
  };
}

// Native bits of a text input that follow the mode: placeholder, cursor and keyboard.
export function useInputProps() {
  const palette = usePalette();
  return {
    placeholderTextColor: palette.inputPlaceholder,
    selectionColor: palette.inputBorderFocus,
    keyboardAppearance: useColorScheme() === 'dark' ? ('dark' as const) : ('light' as const),
  };
}

// Pull-to-refresh spinner colors for both platforms.
export function useRefreshColors() {
  const { primary, card } = usePalette();
  return { tintColor: primary, colors: [primary], progressBackgroundColor: card };
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
