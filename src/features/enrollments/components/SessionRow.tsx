import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import type { StudentSession } from '@/api/types';
import { Button } from '@/components/Button';
import { bogotaParts } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import { spacing, typography, usePalette } from '@/theme';

interface SessionRowProps {
  session: StudentSession;
  minutes: number;
  onCancel: (session: StudentSession) => void;
  onRestore: (session: StudentSession) => void;
  restoring?: boolean;
  // The student has no ACTIVE enrollment, or the period is closed: no actions at all.
  actions: boolean;
}

// A future session with its state as text plus icon and, when allowed, the action. A blocked action
// shows the rule that blocks it (docs/Design.md).
export function SessionRow({ session, minutes, onCancel, onRestore, restoring = false, actions }: SessionRowProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const start = bogotaParts(session.startsAt);
  const end = bogotaParts(session.endsAt);
  const holiday = session.status === 'CANCELLED';
  const state = holiday
    ? t(session.cancelReason === 'HOLIDAY' ? 'student.cancel.session.HOLIDAY' : 'student.cancel.session.CANCELLED')
    : session.cancelledByStudent
      ? t('student.cancel.session.byMe')
      : t(`student.cancel.session.${session.status}`);
  const bad = holiday || session.cancelledByStudent;

  return (
    <View style={styles.row} accessibilityLabel={`${start.date} ${start.time} ${state}`}>
      <Text style={[typography.body, { color: palette.textPrimary }]}>{`${start.date} · ${start.time}–${end.time}`}</Text>
      <View style={styles.state}>
        <Icon name={bad ? 'absent' : 'success'} size={16} color={bad ? palette.error : palette.primary} />
        <Text style={[typography.bodySmall, { color: bad ? palette.error : palette.textSecondary }]}>{state}</Text>
      </View>
      {actions && !holiday ? (
        session.cancelledByStudent ? (
          <Button
            label={t('student.cancel.session.restore')}
            icon="restart"
            variant="tonal"
            loading={restoring}
            disabled={!session.canRestore}
            helperText={session.blockReason ? t(`student.cancel.block.${session.blockReason}`, { minutes }) : undefined}
            onPress={() => onRestore(session)}
          />
        ) : (
          <Button
            label={t('student.cancel.session.cancel')}
            icon="unenroll"
            variant="outlined"
            disabled={!session.canCancel}
            helperText={session.blockReason ? t(`student.cancel.block.${session.blockReason}`, { minutes }) : undefined}
            onPress={() => onCancel(session)}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.sm },
  state: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
