import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/icons/Icon';
import { EmptyState } from '@/components/EmptyState';
import { iconSize, usePalette } from '@/theme';

// Placeholder for tabs that later features fill in.
export function EmptyTabScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: palette.screen }}
    >
      <EmptyState
        icon={
          <Icon
            name="modules"
            size={iconSize.empty}
            color={palette.textSecondary}
          />
        }
        title={t('empty.title')}
        description={t('empty.description')}
      />
    </SafeAreaView>
  );
}
