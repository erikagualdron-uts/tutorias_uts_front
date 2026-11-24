import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { targetFor } from '@/features/notifications/openTarget';
import { spacing, usePalette } from '@/theme';
import { ChangeRow } from '../components/ChangeRow';
import { useAdminChangePages } from '../hooks/useAdminDashboard';

// "See all" of the CAE's recent changes: every cancellation and reschedule, a page at a time.
export function ChangesScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const list = useAdminChangePages();
  const items = list.data?.pages.flatMap((page) => page.data) ?? [];

  const body = list.isPending ? (
    <BrandLoader />
  ) : list.isError ? (
    <EmptyState
      title={t('dashboard.loadError')}
      description={errorMessage(t, list.error)}
      action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => list.refetch()} />}
    />
  ) : (
    <EmptyState title={t('dashboard.admin.changes.title')} description={t('dashboard.admin.changes.empty')} />
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <FlatList
        testID="changes-list"
        data={items}
        keyExtractor={(item) => item.sessionId}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<ScreenHeader title={t('dashboard.admin.changes.title')} count={list.data?.pages[0]?.meta.total} />}
        ListEmptyComponent={body}
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={() => list.refetch()}
        renderItem={({ item }) => (
          <Card>
            <ChangeRow change={item} onPress={() => router.push(targetFor('SUPERADMIN', item.moduleId) as Href)} />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
});
