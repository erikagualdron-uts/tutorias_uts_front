import { SourceCodePro_400Regular } from '@expo-google-fonts/source-code-pro';
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';

// Single place that names the fonts (docs/Design.md, Typography; D-051).
// Fallback while the Myriad Pro files and license are pending: Source Sans 3.
// To switch to Myriad Pro: add the licensed files under assets/fonts/, replace the
// values in `fontAssets` and nothing else; no component writes a font name.
export const fontAssets = {
  regular: { name: 'SourceSans3_400Regular', file: SourceSans3_400Regular },
  semibold: { name: 'SourceSans3_600SemiBold', file: SourceSans3_600SemiBold },
  bold: { name: 'SourceSans3_700Bold', file: SourceSans3_700Bold },
  mono: { name: 'SourceCodePro_400Regular', file: SourceCodePro_400Regular },
} as const;

export const fonts = {
  regular: fontAssets.regular.name,
  semibold: fontAssets.semibold.name,
  bold: fontAssets.bold.name,
  mono: fontAssets.mono.name,
} as const;

// Name to file map for expo-font's useFonts.
export const fontFiles = Object.fromEntries(
  Object.values(fontAssets).map(({ name, file }) => [name, file]),
);

// Longest wait for the fonts before the app continues with the system font.
export const FONT_LOAD_TIMEOUT_MS = 5000;
