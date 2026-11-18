import { View } from 'react-native';
import { usePalette } from '@/theme';
import { BrandLoader } from './BrandLoader';

export function LoadingScreen() {
  const palette = usePalette();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.screen,
      }}
    >
      <BrandLoader />
    </View>
  );
}
