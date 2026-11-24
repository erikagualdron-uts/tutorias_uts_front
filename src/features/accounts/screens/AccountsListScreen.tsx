import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { AccountStatus } from '@/api/types';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { SearchField } from '@/components/SearchField';
import { ScreenHeader } from '@/components/ScreenHeader';
import { spacing, usePalette } from '@/theme';
import { AccountCard } from '../components/AccountCard';
import { AccountSheet } from '../components/AccountSheet';
import { useAccountList, type AccountKind } from '../hooks/useAccountList';

const SEARCH_DELAY_MS = 300;

// The CAE list of teacher or student accounts: search and status go to the server, pages load at the end.
export function AccountsListScreen({ kind }: { kind: AccountKind }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AccountStatus>();
  const [selected, setSelected] = useState<string | null>(null);
  const list = useAccountList(kind, { search, status });
  const kinds = `${kind}s` as const;

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const items = list.data?.pages.flatMap((page) => page.data) ?? [];
  const filtered = Boolean(search.trim() || status);

  const header = (
    <View style={styles.header}>
      <ScreenHeader title={t(`more.${kinds}`)} count={list.data?.pages[0]?.meta.total} />
      <SearchField
        label={t('accounts.search')}
        onCard={false}
        value={text}
        onChangeText={setText}
        onClear={() => {
          setText('');
          setSearch('');
        }}
      />
      <FilterChips
        options={[
          { value: undefined, label: t('accounts.filter.all') },
          { value: 'ACTIVE', label: t('accounts.filter.active') },
          { value: 'INACTIVE', label: t('accounts.filter.inactive') },
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
      title={t('accounts.loadError')}
      description={errorMessage(t, list.error)}
      action={
        <Button
          label={t('common.tryAgain')}
          icon="restart"
          variant="tonal"
          onPress={() => list.refetch()}
        />
      }
    />
  ) : (
    <EmptyState
      title={t(
        filtered
          ? 'accounts.emptyFiltered.title'
          : `accounts.empty.${kinds}.title`,
      )}
      description={t(
        filtered
          ? 'accounts.emptyFiltered.description'
          : `accounts.empty.${kinds}.description`,
      )}
    />
  );

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <FlatList
        testID="accounts-list"
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        onEndReached={() =>
          list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()
        }
        renderItem={({ item }) => (
          <AccountCard
            name={`${item.firstName} ${item.lastName}`}
            email={item.email}
            status={item.status}
            countLabel={
              'modulesCount' in item
                ? t('accounts.modules', { count: item.modulesCount })
                : t('accounts.enrollments', { count: item.enrolledCount })
            }
            onPress={() => setSelected(item.id)}
          />
        )}
        ListFooterComponent={
          list.isFetchingNextPage ? <BrandLoader /> : undefined
        }
      />
      {selected ? (
        <AccountSheet
          kind={kind}
          id={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.lg },
});
