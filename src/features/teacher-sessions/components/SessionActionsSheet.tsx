import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';
import type { TeacherSession } from '@/api/types';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { bogotaParts } from '@/features/modules/format';
import { radius, spacing, typography, usePalette } from '@/theme';

interface SessionActionsSheetProps {
  session: TeacherSession;
  minutes: number;
  onClose: () => void;
}

// Bottom sheet of one session: what it is, the rule of the hour and, when blocked, why.
export function SessionActionsSheet({ session, minutes, onClose }: SessionActionsSheetProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const start = bogotaParts(session.startsAt);
  const end = bogotaParts(session.endsAt);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        <View style={[styles.sheet, { backgroundColor: palette.card }]}>
          <Text accessibilityRole="header" style={[typography.sectionTitle, { color: palette.textPrimary }]}>
            {session.moduleName}
          </Text>
          <Text style={[typography.body, { color: palette.textSecondary }]}>
            {`${start.date} · ${start.time}–${end.time}`}
          </Text>
          <Text style={[typography.body, { color: palette.textSecondary }]}>
            {t('teacher.schedule.rule', { minutes })}
          </Text>
          {session.blockReason ? (
            <Banner message={t(`teacher.schedule.block.${session.blockReason}`, { minutes })} />
          ) : null}
          <Button label={t('teacher.schedule.close')} icon="closeCircle" variant="tonal" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: spacing.lg, gap: spacing.lg },
});
