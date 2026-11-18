import { Image } from 'expo-image';
import { useColorScheme } from 'react-native';

// Official UTS logo over the green gradient, never recolored or stretched (docs/Design.md). Source: 1448x1086.
const LOGO = {
  light: require('../../assets/brand/logo-uts-no-bg-letras-blancas.png'),
  dark: require('../../assets/brand/logo-uts-blanco.png'),
};

export function BrandLogo({ width }: { width: number }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <Image
      source={LOGO[scheme]}
      contentFit="contain"
      style={{ width, aspectRatio: 1448 / 1086 }}
      accessible={false}
    />
  );
}
