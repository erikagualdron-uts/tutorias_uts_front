import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { spacing, usePalette } from '@/theme';
import { PqrsBody } from '../components/PqrsBody';
import { useMyPqrsDetail } from '../hooks/useAuthorPqrs';

// One of my PQRS: its state, what I wrote and the replies of the CAE.
export function PqrsDetailScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useMyPqrsDetail(id);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {detail.isPending ? (
          <BrandLoader />
        ) : detail.isError ? (
          <EmptyState
            title={t('pqrs.detail.loadError')}
            description={errorMessage(t, detail.error)}
            action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => detail.refetch()} />}
          />
        ) : (
          <PqrsBody pqrs={detail.data} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
});
