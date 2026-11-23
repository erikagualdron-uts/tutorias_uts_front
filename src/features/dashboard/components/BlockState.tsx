import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { spacing, typography, usePalette } from '@/theme';

interface BlockQuery {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

// The four states of one block: loading, error with retry, empty with its sentence, or the data.
// A failing block never touches the others (FR-012).
export function BlockState({ query, emptyText, children }: { query: BlockQuery; emptyText?: string; children: ReactNode }) {
  const { t } = useTranslation();
  const palette = usePalette();
  if (query.isPending) {
    return (
      <View style={styles.loading}>
        <BrandLoader />
      </View>
    );
  }
  if (query.isError) {
    return (
      <Card style={styles.card}>
        <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{t('dashboard.loadError')}</Text>
        <Text style={[typography.body, { color: palette.textSecondary }]}>{errorMessage(t, query.error)}</Text>
        <Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => query.refetch()} />
      </Card>
    );
  }
  if (emptyText) {
    return (
      <Card>
        <Text style={[typography.body, { color: palette.textSecondary }]}>{emptyText}</Text>
      </Card>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  card: { gap: spacing.md },
});
