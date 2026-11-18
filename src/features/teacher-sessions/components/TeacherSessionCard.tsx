import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TeacherSession } from '@/api/types';
import { Card } from '@/components/Card';
import { bogotaParts } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import { radius, spacing, typography, usePalette } from '@/theme';

export function sessionStateKey(session: TeacherSession) {
  if (session.status === 'CANCELLED') return session.cancelReason === 'TEACHER' ? 'TEACHER' : 'HOLIDAY';
  return session.status;
}

// A session of the teacher: module, hours (Bogota), room and attendees. The state is text plus icon.
export function TeacherSessionCard({ session, onPress }: { session: TeacherSession; onPress: () => void }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const start = bogotaParts(session.startsAt);
  const end = bogotaParts(session.endsAt);
  const original = bogotaParts(session.originalStartsAt);
  const cancelled = session.status === 'CANCELLED';
  const moved = session.status === 'RESCHEDULED';
  const state = t(`teacher.schedule.state.${sessionStateKey(session)}`);
  const color = cancelled ? palette.error : moved ? palette.warning : palette.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${session.moduleName}. ${start.date} ${start.time}. ${state}`}
      onPress={onPress}
    >
      <Card style={styles.card}>
        <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{session.moduleName}</Text>
        <View style={styles.row}>
          <Icon name="clock" size={16} color={palette.textSecondary} />
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>{`${start.time}–${end.time}`}</Text>
        </View>
        <View style={styles.row}>
          <Icon name="location" size={16} color={palette.textSecondary} />
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
            {t('student.modules.card.room', { room: session.room.name, location: session.room.location })}
          </Text>
        </View>
        <View style={styles.row}>
          <Icon name="user" size={16} color={palette.textSecondary} />
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
            {t('teacher.schedule.attendees', { attendees: session.attendees })}
          </Text>
        </View>
        <View style={[styles.badge, { borderColor: color }]}>
          <Icon name={cancelled ? 'absent' : moved ? 'reschedule' : 'success'} size={16} color={color} />
          <Text style={[typography.label, { color }]}>{state}</Text>
        </View>
        {moved ? (
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
            {t('teacher.schedule.original', { time: original.time, date: original.date })}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
