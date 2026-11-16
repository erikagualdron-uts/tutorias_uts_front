import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { usePalette } from '@/theme';

// Placeholder for tabs that later features fill in.
export function EmptyTabScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <EmptyState
        icon={
          <Ionicons
            name="albums-outline"
            size={48}
            color={palette.textSecondary}
            accessibilityLabel={t('empty.title')}
          />
        }
        title={t('empty.title')}
        description={t('empty.description')}
      />
    </SafeAreaView>
  );
}
