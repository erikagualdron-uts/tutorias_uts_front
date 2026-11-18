import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { bogotaParts } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import { radius, spacing, typography, usePalette } from '@/theme';
import type { CalendarItem } from './types';

interface SessionBlockProps {
  item: CalendarItem;
  // Week columns: hours, room and state only.
  compact?: boolean;
  onPress: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

// A session on the calendar. Its state is text plus icon, and a cancelled one stays visible and struck through.
export function SessionBlock({ item, compact = false, onPress, style }: SessionBlockProps) {
  const palette = usePalette();
  const start = bogotaParts(item.startsAt).time;
  const end = bogotaParts(item.endsAt).time;
  const cancelled = item.status === 'CANCELLED';
  const moved = item.status === 'RESCHEDULED';
  const accent = cancelled ? palette.error : moved ? palette.warning : palette.primary;
  const struck = item.strike ? styles.struck : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[item.title, `${start}–${end}`, item.room, item.badge].join(', ')}
      hitSlop={{ top: 2, bottom: 2 }}
      onPress={() => onPress(item.id)}
      style={[styles.block, { backgroundColor: palette.surface, borderLeftColor: accent }, style]}
    >
      <Text numberOfLines={1} style={[typography.label, { color: palette.textPrimary }, struck]}>
        {`${start}–${end}`}
      </Text>
      {compact ? null : (
        <Text numberOfLines={2} style={[typography.cardTitle, { color: palette.textPrimary }, struck]}>
          {item.title}
        </Text>
      )}
      <Text numberOfLines={1} style={[typography.bodySmall, { color: palette.textSecondary }, struck]}>
        {item.room}
      </Text>
      {compact || item.detail === '' ? null : (
        <Text numberOfLines={1} style={[typography.bodySmall, { color: palette.textSecondary }, struck]}>
          {item.detail}
        </Text>
      )}
      <View style={styles.badge}>
        <Icon name={cancelled ? 'absent' : moved ? 'reschedule' : 'success'} size={16} color={accent} />
        <Text numberOfLines={1} style={[typography.label, styles.badgeText, { color: palette.textPrimary }]}>
          {item.badge}
        </Text>
      </View>
      {item.note && !compact ? (
        <Text numberOfLines={1} style={[typography.bodySmall, { color: palette.textSecondary }]}>
          {item.note}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    borderLeftWidth: 4,
    borderRadius: radius.badge,
    padding: spacing.sm,
    overflow: 'hidden',
    gap: spacing.xs,
  },
  struck: { textDecorationLine: 'line-through' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badgeText: { flexShrink: 1 },
});
