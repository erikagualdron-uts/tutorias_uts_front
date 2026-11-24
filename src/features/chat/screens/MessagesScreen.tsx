import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { Role } from '@/api/types';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ScreenHeader } from '@/components/ScreenHeader';
import { NotificationsPanel } from '@/features/notifications/screens/NotificationsScreen';
import { useSession } from '@/store/session';
import { spacing, usePalette } from '@/theme';
import { ConversationRow } from '../components/ConversationRow';
import { ReconnectBanner } from '../components/ReconnectBanner';
import { useConversations } from '../hooks/useChatData';

type Tab = 'alerts' | 'chats';

// Each role group has its own messages routes.
export const messagesBase = (role: Role | undefined) =>
  role === 'STUDENT' ? '/(student)/messages' : role === 'TEACHER' ? '/(teacher)/messages' : '/(admin)/messages';

// The Messages tab: the change alerts of the spec 014 and the chats of the spec 018.
export function MessagesScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const role = useSession((s) => s.user?.role);
  const [tab, setTab] = useState<Tab>('chats');
  const base = messagesBase(role);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <View style={styles.header}>
        <ScreenHeader title={t('tabs.messages')} />
      </View>
      <View style={styles.tabs}>
        <SegmentedControl
          label={t('tabs.messages')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'alerts', label: t('chat.tabs.alerts'), icon: 'notifications' },
            { value: 'chats', label: t('chat.tabs.chats'), icon: 'messages' },
          ]}
        />
      </View>
      {tab === 'alerts' ? (
        <NotificationsPanel />
      ) : (
        <>
          <ReconnectBanner />
          <Chats onNew={() => router.push(`${base}/new` as Href)} onOpen={(id) => router.push({ pathname: `${base}/[id]`, params: { id } } as Href)} />
        </>
      )}
    </SafeAreaView>
  );
}

function Chats({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const list = useConversations();
  const items = list.data ?? [];

  const body = list.isPending ? (
    <BrandLoader />
  ) : list.isError ? (
    <EmptyState
      title={t('chat.list.loadError')}
      description={errorMessage(t, list.error)}
      action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => list.refetch()} />}
    />
  ) : (
    <EmptyState title={t('chat.list.empty.title')} description={t('chat.list.empty.description')} />
  );

  return (
    <FlatList
      testID="chat-list"
      data={items}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<Button label={t('chat.list.newMessage')} icon="add" onPress={onNew} />}
      ListEmptyComponent={body}
      refreshing={list.isRefetching}
      onRefresh={() => list.refetch()}
      renderItem={({ item }) => <ConversationRow conversation={item} onPress={() => onOpen(item.id)} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: spacing.lg, paddingBottom: 0 },
  tabs: { padding: spacing.lg, paddingBottom: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.md },
});
