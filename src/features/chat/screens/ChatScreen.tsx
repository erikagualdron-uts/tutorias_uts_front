import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { bogotaParts } from '@/features/modules/format';
import { useSession } from '@/store/session';
import { spacing, typography, usePalette } from '@/theme';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { Avatar } from '../components/Avatar';
import { Composer } from '../components/Composer';
import { DateSeparator } from '../components/DateSeparator';
import { MessageBubble } from '../components/MessageBubble';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { ReconnectBanner } from '../components/ReconnectBanner';
import { useConversation, useMarkRead, useMessages } from '../hooks/useChatData';
import { usePendingMessages } from '../hooks/usePendingMessages';
import { useOpenConversation } from '../hooks/useChatSocket';
import { useKeyboardLift } from '../hooks/useKeyboardLift';
import { personName, type ChatMessage, type PendingMessage } from '../types';

type Row = { kind: 'pending'; item: PendingMessage } | { kind: 'message'; item: ChatMessage };

// One conversation: the history from the newest at the bottom, the date separators, the states of what I
// send, the "Reconnecting…" banner and the composer, or the rule that keeps it read-only.
export function ChatScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useSession((s) => s.user?.id);
  const conversation = useConversation(id);
  const messages = useMessages(id);
  const { pending, send, retry, discard } = usePendingMessages(id);
  const { mutate: markAsRead } = useMarkRead(id);
  useOpenConversation(id);
  const [keyboardRef, keyboardLift] = useKeyboardLift();

  const history = messages.data?.pages.flatMap((page) => page.data) ?? [];
  const latest = history[0]?.id;
  // Read when it opens and every time something newer arrives while it is open.
  useEffect(() => {
    if (conversation.isSuccess && latest) markAsRead();
  }, [conversation.isSuccess, latest, markAsRead]);

  const rows: Row[] = [
    ...[...pending].reverse().map((item): Row => ({ kind: 'pending', item })),
    ...history.map((item): Row => ({ kind: 'message', item })),
  ];
  const detail = conversation.data;
  const retryAll = () => {
    void conversation.refetch();
    void messages.refetch();
  };

  const day = (row: Row) => bogotaParts(row.item.createdAt).date;
  const startsDay = (index: number) => {
    const older = rows[index + 1];
    return older ? day(older) !== day(rows[index]) : !messages.hasNextPage;
  };

  const writer = (row: Row) => (row.kind === 'pending' ? me : row.item.sender.id);
  // First of a run: no older message, a new day, another writer or an announcement in between.
  const startsRun = (index: number) => {
    const older = rows[index + 1];
    const isAnnouncement = (r: Row) => r.kind === 'message' && r.item.kind === 'ANNOUNCEMENT';
    return !older || startsDay(index) || writer(older) !== writer(rows[index]) || isAnnouncement(older);
  };

  const body =
    conversation.isPending || messages.isPending ? (
      <BrandLoader />
    ) : conversation.isError || messages.isError || !detail ? (
      <EmptyState
        title={t('chat.conversation.loadError')}
        description={errorMessage(t, conversation.error ?? messages.error)}
        action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={retryAll} />}
      />
    ) : (
      <FlatList
        testID="chat-messages"
        inverted
        data={rows}
        keyExtractor={(row) => (row.kind === 'pending' ? row.item.clientMessageId : row.item.id)}
        contentContainerStyle={styles.list}
        onEndReachedThreshold={0.4}
        onEndReached={() => messages.hasNextPage && !messages.isFetchingNextPage && void messages.fetchNextPage()}
        ListFooterComponent={messages.isFetchingNextPage ? <BrandLoader /> : undefined}
        ListEmptyComponent={<Text style={[typography.body, styles.empty, { color: palette.textSecondary }]}>{t('chat.conversation.empty')}</Text>}
        renderItem={({ item: row, index }) => (
          <View style={[styles.cell, startsRun(index) && styles.runStart]}>
            {startsDay(index) ? <DateSeparator iso={row.item.createdAt} /> : null}
            {row.kind === 'pending' ? (
              <MessageBubble message={row.item} mine first={startsRun(index)} state={row.item.status} onRetry={() => retry(row.item.clientMessageId)} onDiscard={() => discard(row.item.clientMessageId)} />
            ) : row.item.kind === 'ANNOUNCEMENT' ? (
              <AnnouncementCard message={row.item} />
            ) : (
              <MessageBubble message={row.item} mine={row.item.sender.id === me} first={startsRun(index)} showSender={detail.type === 'MODULE'} state={row.item.sender.id === me ? 'sent' : undefined} />
            )}
          </View>
        )}
      />
    );

  const title = detail ? (detail.module ? detail.module.name : detail.partner ? personName(detail.partner) : '') : '';

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <View ref={keyboardRef} collapsable={false} style={[styles.screen, { paddingBottom: keyboardLift }]}>
        <View style={styles.header}>
          {detail ? <Avatar group={Boolean(detail.module)} firstName={detail.partner?.firstName} lastName={detail.partner?.lastName} /> : null}
          <View style={styles.titles}>
            <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{title}</Text>
            {detail?.module ? <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>{t('chat.moduleChat')}</Text> : null}
          </View>
        </View>
        <ReconnectBanner />
        <View style={styles.screen}>{body}</View>
        {detail ? (
          detail.canWrite ? (
            <Composer maxLength={detail.limits.messageMaxLength} canAnnounce={detail.canAnnounce} onSend={send} />
          ) : (
            <View style={styles.notice}>
              <ReadOnlyNotice reason={detail.readOnlyReason} />
            </View>
          )
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  titles: { flex: 1, gap: spacing.xs },
  list: { padding: spacing.lg },
  cell: { gap: spacing.xs, marginTop: 2 },
  runStart: { marginTop: spacing.md },
  empty: { textAlign: 'center', padding: spacing.xl },
  notice: { padding: spacing.lg },
});
