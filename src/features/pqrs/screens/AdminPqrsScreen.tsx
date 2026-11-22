import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { PqrsStatus } from '@/api/types';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { useDropdownList } from '@/features/dropdown-lists/hooks/useDropdownLists';
import { labelFor } from '@/features/dropdown-lists/schemas';
import { spacing, typography, usePalette } from '@/theme';
import { PqrsCard } from '../components/PqrsCard';
import { useAdminPqrs, type AdminPqrsFilters } from '../hooks/useAdminPqrs';

const STATUSES: PqrsStatus[] = ['FILED', 'IN_REVIEW', 'RESOLVED'];
const ROLES = ['TEACHER', 'STUDENT'] as const;

// Every PQRS for the CAE: the three filters (state, type, author role) go to the server and combine.
export function AdminPqrsScreen() {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const [filters, setFilters] = useState<AdminPqrsFilters>({});
  const list = useAdminPqrs(filters);
  // Every type, also the deactivated ones: a PQRS keeps the type it was filed with.
  const types = useDropdownList('PQRS_TYPE').data?.items ?? [];
  const items = list.data?.pages.flatMap((page) => page.data) ?? [];
  const filtered = Boolean(filters.status || filters.typeId || filters.authorRole);
  const set = <K extends keyof AdminPqrsFilters>(key: K) => (value: AdminPqrsFilters[K]) => setFilters((old) => ({ ...old, [key]: value }));

  const header = (
    <View style={styles.header}>
      <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('pqrs.admin.title')}</Text>
      <FilterChips
        options={[
          { value: undefined, label: t('pqrs.list.filterAll') },
          ...STATUSES.map((value) => ({ value, label: t(`pqrs.status.${value}`) })),
        ]}
        value={filters.status}
        onChange={set('status')}
      />
      <FilterChips
        options={[
          { value: undefined, label: t('pqrs.admin.typeAll') },
          ...types.map((item) => ({ value: item.id, label: labelFor(item, i18n.language) })),
        ]}
        value={filters.typeId}
        onChange={set('typeId')}
      />
      <FilterChips
        options={[
          { value: undefined, label: t('pqrs.admin.role.all') },
          ...ROLES.map((value) => ({ value, label: t(`pqrs.admin.role.${value}`) })),
        ]}
        value={filters.authorRole}
        onChange={set('authorRole')}
      />
    </View>
  );

  const body = list.isPending ? (
    <BrandLoader />
  ) : list.isError ? (
    <EmptyState
      title={t('pqrs.admin.loadError')}
      description={errorMessage(t, list.error)}
      action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => list.refetch()} />}
    />
  ) : (
    <EmptyState
      title={t(filtered ? 'pqrs.admin.emptyFiltered.title' : 'pqrs.admin.empty.title')}
      description={t(filtered ? 'pqrs.admin.emptyFiltered.description' : 'pqrs.admin.empty.description')}
    />
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <FlatList
        testID="admin-pqrs-list"
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={() => list.refetch()}
        renderItem={({ item }) => (
          <PqrsCard
            pqrs={item}
            authorLine={`${item.author.firstName} ${item.author.lastName} · ${t(`pqrs.admin.authorRole.${item.author.role}`)}`}
            onPress={() => router.push({ pathname: '/(admin)/pqrs/[id]', params: { id: item.id } } as Href)}
          />
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
