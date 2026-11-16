import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

export function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator accessibilityLabel={t('common.loading')} />
    </View>
  );
}
