import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { usePalette } from '@/theme';

export function LoadingScreen() {
  const { t } = useTranslation();
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
      <ActivityIndicator accessibilityLabel={t('common.loading')} />
    </View>
  );
}
