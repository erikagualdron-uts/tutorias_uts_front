import { Image } from 'expo-image';
import { brandAssets, type BrandLogoVariant } from './brandAssets';

// Official UTS logo, never recolored or stretched (docs/Design.md). Renders nothing until the file exists.
export function BrandLogo({
  variant,
  width,
}: {
  variant: BrandLogoVariant;
  width: number;
}) {
  const source = brandAssets[variant];
  if (!source) return null;
  return (
    <Image
      source={source}
      contentFit="contain"
      style={{ width, aspectRatio: variant === 'mark' ? 1 : 3 }}
      accessible={false}
    />
  );
}
