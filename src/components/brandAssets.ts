import type { ImageSource } from 'expo-image';

export type BrandLogoVariant = 'full' | 'white' | 'mark';

// TODO(T002): the university supplies the official files in assets/brand/.
// When they exist, replace each `undefined` with require('../../assets/brand/<file>.svg').
export const brandAssets: Record<BrandLogoVariant, ImageSource | undefined> = {
  full: undefined, // uts-logo.svg
  white: undefined, // uts-logo-white.svg
  mark: undefined, // uts-logo-mark.svg
};
