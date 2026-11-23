import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { bogotaParts } from '@/features/modules/format';
import { MIN_TOUCH_TARGET, radius, spacing, typography, usePalette } from '@/theme';
import { personName, type ConversationSummary } from '../types';
import { Avatar } from './Avatar';

// One conversation of the list: who or which module, the last message, its time and the unread count as text.
export function ConversationRow({ conversation, onPress }: { conversation: ConversationSummary; onPress: () => void }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { module, partner, lastMessage, unread } = conversation;
  const title = module ? module.name : partner ? personName(partner) : '';
  const preview = lastMessage
    ? `${lastMessage.kind === 'ANNOUNCEMENT' ? `${t('chat.announcementPrefix')}: ` : ''}${lastMessage.body}`
    : t('chat.noMessages');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${preview}${unread > 0 ? `. ${t('chat.unread', { count: unread })}` : ''}`}
      onPress={onPress}
      style={styles.touch}
    >
      <Card style={styles.card}>
        <Avatar group={Boolean(module)} firstName={partner?.firstName} lastName={partner?.lastName} />
        <View style={styles.text}>
          <Text numberOfLines={1} style={[typography.cardTitle, { color: palette.textPrimary }]}>{title}</Text>
          <Text numberOfLines={1} style={[typography.bodySmall, { color: palette.textSecondary }]}>{preview}</Text>
        </View>
        <View style={styles.side}>
          {lastMessage ? <Text style={[typography.metadata, { color: palette.textSecondary }]}>{bogotaParts(lastMessage.createdAt).time}</Text> : null}
          {unread > 0 ? (
            <View style={[styles.pill, { backgroundColor: palette.primary }]}>
              <Text style={[typography.label, { color: palette.onPrimary }]}>{t('chat.unread', { count: unread })}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { minHeight: MIN_TOUCH_TARGET },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: spacing.xs },
  side: { alignItems: 'flex-end', gap: spacing.xs },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
});
