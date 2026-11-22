import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppNotification } from '@/api/types';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/icons/Icon';
import { useSession } from '@/store/session';
import { iconSize, spacing, usePalette } from '@/theme';
import { NotificationCard } from '../components/NotificationCard';
import { useMarkAllRead, useMarkRead } from '../hooks/useMarkRead';
import { useNotifications } from '../hooks/useNotifications';
import { usePushPermission } from '../hooks/usePushPermission';
import { noticeTarget } from '../openTarget';

// The inbox of any role: newest first, unread highlighted, more pages as the end is reached.
export function NotificationsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const role = useSession((state) => state.user?.role);
  const list = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const push = usePushPermission();
  const items = list.data?.pages.flatMap((page) => page.data) ?? [];
  const hasUnread = items.some((n) => n.readAt === null);

  const open = (notice: AppNotification) => {
    if (notice.readAt === null) markRead.mutate(notice.id);
    const target = role ? noticeTarget(role, notice) : null;
    if (target) router.push(target);
  };

  const retry = <Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => list.refetch()} />;
  const state = list.isPending ? (
    <BrandLoader />
  ) : list.isError && items.length === 0 ? (
    <EmptyState title={t('notifications.loadError')} description={errorMessage(t, list.error)} action={retry} />
  ) : items.length === 0 ? (
    <EmptyState
      title={t('notifications.empty.title')}
      description={t('notifications.empty.description')}
      icon={<Icon name="notificationsOff" size={iconSize.empty} color={palette.textSecondary} />}
    />
  ) : null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      {/* Above the list so it also shows with an empty inbox, where it is needed most. */}
      {push.state === 'undetermined' || push.state === 'denied' ? (
        <View style={styles.pushHint}>
          <Banner message={push.state === 'denied' ? t('notifications.push.disabled') : t('notifications.push.description')} severity="warning" />
          <Button label={t('notifications.push.enable')} icon="notifications" variant="outlined" onPress={() => void push.enable()} />
        </View>
      ) : null}
      {state ? (
        <View style={styles.state}>{state}</View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={items}
          keyExtractor={(notice) => notice.id}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={Gap}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          ListHeaderComponent={
            <View style={styles.header}>
              {list.isError ? <Banner message={errorMessage(t, list.error)} severity="error" /> : null}
              {hasUnread ? (
                <Button
                  label={t('notifications.markAllRead')}
                  icon="checkRead"
                  variant="tonal"
                  loading={markAll.isPending}
                  onPress={() => markAll.mutate()}
                />
              ) : null}
            </View>
          }
          ListFooterComponent={list.isFetchingNextPage ? <BrandLoader /> : undefined}
          renderItem={({ item }) => <NotificationCard notification={item} onPress={() => open(item)} />}
        />
      )}
    </SafeAreaView>
  );
}

const Gap = () => <View style={styles.gap} />;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  state: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  content: { padding: spacing.lg },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  pushHint: { gap: spacing.lg, padding: spacing.lg, paddingBottom: 0 },
  gap: { height: spacing.lg },
});
