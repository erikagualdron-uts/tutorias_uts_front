import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppNotification, NotificationType } from '@/api/types';
import { Card } from '@/components/Card';
import { bogotaParts } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { MIN_TOUCH_TARGET, radius, spacing, typography, usePalette } from '@/theme';

const ICONS: Record<NotificationType, IconName> = {
  SESSION_RESCHEDULED: 'reschedule',
  SESSION_CANCELLED_TEACHER: 'absent',
  SESSIONS_CANCELLED_HOLIDAY: 'absent',
  SESSION_RESTORED_TEACHER: 'success',
  SESSIONS_RESTORED_HOLIDAY: 'success',
  MODULE_TEACHER_CHANGED: 'user',
  MODULE_ROOM_CHANGED: 'location',
  PQRS_IN_REVIEW: 'pqrs',
  PQRS_RESPONDED: 'pqrs',
  PQRS_RESOLVED: 'success',
};

// One notice of the inbox. An unread one is marked by text, a bold icon and a side line, never by
// color alone (docs/Design.md, accessibility). The whole card is the 48 px target that opens the module.
export function NotificationCard({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const unread = notification.readAt === null;
  const when = bogotaParts(notification.createdAt);
  const cancelled = notification.type === 'SESSION_CANCELLED_TEACHER' || notification.type === 'SESSIONS_CANCELLED_HOLIDAY';
  const color = cancelled ? palette.errorText : palette.primary; // errorText: 4.5:1 on the card in dark too

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? `${t('notifications.unread')}. ` : ''}${notification.title}. ${when.date} ${when.time}. ${t('notifications.open')}`}
      onPress={onPress}
      style={styles.touch}
    >
      <Card style={[styles.card, unread && { borderLeftWidth: 4, borderLeftColor: color }]}>
        <View style={styles.header}>
          <Icon name={ICONS[notification.type]} active={unread} size={20} color={color} />
          <Text style={[typography.cardTitle, styles.title, { color: palette.textPrimary }]}>{notification.title}</Text>
        </View>
        <Text style={[typography.body, { color: palette.textPrimary }]}>{notification.body}</Text>
        <View style={styles.footer}>
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>{`${when.date} · ${when.time}`}</Text>
          {unread ? (
            <View style={[styles.badge, { borderColor: color }]}>
              <Text style={[typography.label, { color }]}>{t('notifications.unread')}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { minHeight: MIN_TOUCH_TARGET },
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  badge: {
    borderWidth: 1,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
