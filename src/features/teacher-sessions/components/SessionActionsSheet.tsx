import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SessionScope, TeacherSession } from '@/api/types';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { FilterChips } from '@/components/FilterChips';
import { SelectField } from '@/components/SelectField';
import { bogotaDay, bogotaParts } from '@/features/modules/format';
import { PickerSheet } from '@/features/modules/components/PickerSheet';
import { TIME_OPTIONS } from '@/features/modules/schemas';
import { radius, spacing, typography, usePalette } from '@/theme';
import { weekBounds, toUtcIso } from '../format';
import { useReschedule, useRescheduleCheck } from '../hooks/useTeacherSessions';

interface SessionActionsSheetProps {
  session: TeacherSession;
  minutes: number;
  onClose: () => void;
}

type Mode = 'menu' | 'reschedule';

// Bottom sheet of one session: what it is, the rule of the hour and the actions the rules allow.
// A blocked action shows the rule that blocks it (docs/Design.md).
export function SessionActionsSheet({ session, minutes, onClose }: SessionActionsSheetProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const start = bogotaParts(session.startsAt);
  const end = bogotaParts(session.endsAt);
  const [mode, setMode] = useState<Mode>('menu');
  const [scope, setScope] = useState<SessionScope>('SESSION');
  const [day, setDay] = useState(bogotaDay(session.startsAt));
  const [time, setTime] = useState(start.time);
  const [picking, setPicking] = useState(false);
  const check = useRescheduleCheck();
  const reschedule = useReschedule();
  const week = weekBounds(bogotaDay(session.startsAt));
  const startsAt = toUtcIso(day, time);
  const unchanged = startsAt === new Date(session.startsAt).toISOString();

  // Asking the API while the teacher chooses shows the reason before confirming (dryRun).
  useEffect(() => {
    if (mode !== 'reschedule' || unchanged) return;
    check.mutate({ sessionId: session.id, scope, startsAt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, scope, startsAt]);

  const failure = [check, reschedule].find((m) => m.isError)?.error;
  const ready = mode === 'reschedule' && !unchanged && check.isSuccess && !reschedule.isPending;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        <ScrollView style={[styles.sheet, { backgroundColor: palette.card }]} contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={[typography.sectionTitle, { color: palette.textPrimary }]}>
            {session.moduleName}
          </Text>
          <Text style={[typography.body, { color: palette.textSecondary }]}>
            {`${start.date} · ${start.time}–${end.time}`}
          </Text>
          <Text style={[typography.body, { color: palette.textSecondary }]}>
            {t('teacher.schedule.rule', { minutes })}
          </Text>
          {session.blockReason ? <Banner message={t(`teacher.schedule.block.${session.blockReason}`, { minutes })} /> : null}

          {mode === 'menu' ? (
            <>
              {session.canReschedule ? (
                <Button label={t('teacher.reschedule.action')} icon="reschedule" onPress={() => setMode('reschedule')} />
              ) : null}
              <Button label={t('teacher.schedule.close')} icon="closeCircle" variant="tonal" onPress={onClose} />
            </>
          ) : (
            <>
              <FilterChips<SessionScope>
                options={[
                  { value: 'SESSION', label: t('teacher.reschedule.scope.SESSION') },
                  { value: 'SERIES', label: t('teacher.reschedule.scope.SERIES') },
                ]}
                value={scope}
                onChange={(value) => setScope(value ?? 'SESSION')}
              />
              <DateField
                label={t('teacher.reschedule.date')}
                placeholder={t('teacher.reschedule.date')}
                value={day}
                minDate={week.from}
                maxDate={week.to}
                hint={t('teacher.reschedule.weekHint')}
                onChange={setDay}
                onCard={false}
              />
              <SelectField
                label={t('teacher.reschedule.time')}
                placeholder={t('teacher.reschedule.time')}
                leadingIcon="clock"
                value={time}
                onPress={() => setPicking(true)}
                onCard={false}
              />
              {check.isPending ? (
                <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>{t('teacher.reschedule.checking')}</Text>
              ) : null}
              {check.isSuccess && !unchanged ? (
                <Text style={[typography.bodySmall, { color: palette.primary }]}>
                  {t('teacher.reschedule.available', { sessions: check.data.sessions.length })}
                </Text>
              ) : null}
              {failure && !unchanged ? <Banner message={errorMessage(t, failure)} /> : null}
              <Button
                label={t('teacher.reschedule.confirm')}
                icon="reschedule"
                disabled={!ready}
                loading={reschedule.isPending}
                helperText={unchanged ? t('teacher.reschedule.pickAnother') : undefined}
                onPress={() => reschedule.mutate({ sessionId: session.id, scope, startsAt }, { onSuccess: onClose })}
              />
              <Button label={t('teacher.reschedule.back')} icon="back" variant="tonal" onPress={() => setMode('menu')} />
            </>
          )}
        </ScrollView>
      </View>
      <PickerSheet
        visible={picking}
        title={t('teacher.reschedule.time')}
        options={TIME_OPTIONS.map((value) => ({ value, label: value }))}
        selected={time}
        emptyText={t('teacher.reschedule.time')}
        onClose={() => setPicking(false)}
        onSelect={(value) => {
          setTime(value);
          setPicking(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, maxHeight: '90%' },
  content: { padding: spacing.lg, gap: spacing.lg },
});
