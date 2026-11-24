import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { bogotaParts } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { MIN_TOUCH_TARGET, radius, useShadows, spacing, typography, usePalette } from '@/theme';
import { personName, type ChatMessage } from '../types';

export type DeliveryState = 'sending' | 'sent' | 'failed';

const ICONS: Record<DeliveryState, IconName> = { sending: 'clock', sent: 'success', failed: 'error' };

interface MessageBubbleProps {
  message: Pick<ChatMessage, 'body' | 'createdAt'> & { sender?: ChatMessage['sender'] };
  mine: boolean;
  // The name of the writer, shown above a message of someone else in a module chat.
  showSender?: boolean;
  // First message of a run by the same person: it gets the tail corner and the writer's name.
  first?: boolean;
  // Only for what I wrote: sending, sent or failed (with a tap to retry). Never color alone.
  state?: DeliveryState;
  onRetry?: () => void;
  // Takes a message that was not sent out of the conversation and the device (sending or failed).
  onDiscard?: () => void;
}

export function MessageBubble({ message, mine, showSender = false, first = true, state, onRetry, onDiscard }: MessageBubbleProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const shadows = useShadows();
  const dark = useColorScheme() === 'dark';
  const ink = mine ? palette.onPrimary : palette.textPrimary;
  const meta = mine ? palette.onPrimary : palette.textSecondary;
  const failed = state === 'failed';

  const bubble = (
    <View
      style={[
        styles.bubble,
        !mine && shadows.level1,
        !mine && dark && { borderWidth: 1, borderColor: palette.border },
        first && (mine ? styles.mineTail : styles.theirsTail),
        { backgroundColor: mine ? palette.primary : palette.card, opacity: state === 'sending' ? 0.6 : 1 },
      ]}
    >
      {first && showSender && !mine && message.sender ? (
        <Text style={[typography.label, { color: palette.primary }]}>{personName(message.sender)}</Text>
      ) : null}
      <Text style={[typography.body, { color: ink }]}>{message.body}</Text>
      <View style={styles.footer} accessible={Boolean(state)} accessibilityLabel={state ? t(`chat.status.${state}`) : undefined}>
        <Text style={[typography.metadata, { color: meta }]}>{bogotaParts(message.createdAt).time}</Text>
        {state ? <Icon name={ICONS[state]} size={14} color={failed ? palette.errorText : meta} /> : null}
        {failed ? <Text style={[typography.metadata, { color: palette.errorText }]}>{t('chat.status.failed')}</Text> : null}
      </View>
    </View>
  );

  const discard = onDiscard ? (
    <Pressable accessibilityRole="button" accessibilityLabel={t('chat.discard')} onPress={onDiscard} style={styles.discard}>
      <Icon name="trash" size={16} color={palette.textSecondary} />
      <Text style={[typography.metadata, { color: palette.textSecondary }]}>{t('chat.discard')}</Text>
    </Pressable>
  ) : null;
  if (!failed || !onRetry) {
    return (
      <View style={mine ? styles.rowMine : styles.rowTheirs}>
        {bubble}
        {discard}
      </View>
    );
  }
  return (
    <View style={styles.rowMine}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('chat.retry')} onPress={onRetry}>
        {bubble}
        <Text style={[typography.metadata, styles.retry, { color: palette.errorText }]}>{t('chat.retry')}</Text>
      </Pressable>
      {discard}
    </View>
  );
}

const styles = StyleSheet.create({
  rowMine: { alignItems: 'flex-end' },
  rowTheirs: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: radius.card, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  mineTail: { borderTopRightRadius: radius.tooltip },
  theirsTail: { borderTopLeftRadius: radius.tooltip },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-end' },
  retry: { textAlign: 'right', marginTop: spacing.xs },
  discard: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: MIN_TOUCH_TARGET, alignSelf: 'flex-end' },
});
