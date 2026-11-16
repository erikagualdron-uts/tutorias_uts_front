import { Image } from 'expo-image';

// Official UTS logo, full color, never recolored or stretched (docs/Design.md). Source: 632x210.
export function BrandLogo({ width }: { width: number }) {
  return (
    <Image
      source={require('../../assets/brand/logo-uts.png')}
      contentFit="contain"
      style={{ width, aspectRatio: 632 / 210 }}
      accessible={false}
    />
  );
}
