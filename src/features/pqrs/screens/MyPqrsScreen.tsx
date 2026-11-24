import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { PqrsStatus } from '@/api/types';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useSession } from '@/store/session';
import { spacing, usePalette } from '@/theme';
import { PqrsCard } from '../components/PqrsCard';
import { useMyPqrs } from '../hooks/useAuthorPqrs';

const STATUSES: PqrsStatus[] = ['FILED', 'IN_REVIEW', 'RESOLVED'];

// My own PQRS (student and teacher): the newest first, filtered by state, with the way to file a new one.
export function MyPqrsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const base = useSession((state) => (state.user?.role === 'TEACHER' ? '/(teacher)/pqrs' : '/(student)/pqrs'));
  const [status, setStatus] = useState<PqrsStatus>();
  const list = useMyPqrs(status);
  const items = list.data?.pages.flatMap((page) => page.data) ?? [];

  const header = (
    <View style={styles.header}>
      <ScreenHeader title={t('pqrs.list.title')} count={list.data?.pages[0]?.meta.total} />
      <Button label={t('pqrs.list.new')} icon="add" onPress={() => router.push(`${base}/new` as Href)} />
      <FilterChips
        scroll
        options={[
          { value: undefined, label: t('pqrs.list.filterAll') },
          ...STATUSES.map((value) => ({ value, label: t(`pqrs.status.${value}`) })),
        ]}
        value={status}
        onChange={setStatus}
      />
    </View>
  );

  const body = list.isPending ? (
    <BrandLoader />
  ) : list.isError ? (
    <EmptyState
      title={t('pqrs.list.loadError')}
      description={errorMessage(t, list.error)}
      action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => list.refetch()} />}
    />
  ) : (
    <EmptyState
      title={t(status ? 'pqrs.list.emptyFiltered.title' : 'pqrs.list.empty.title')}
      description={t(status ? 'pqrs.list.emptyFiltered.description' : 'pqrs.list.empty.description')}
    />
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <FlatList
        testID="pqrs-list"
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={() => list.refetch()}
        renderItem={({ item }) => (
          <PqrsCard pqrs={item} onPress={() => router.push({ pathname: `${base}/[id]`, params: { id: item.id } } as Href)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.sm },
});
