import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { formatDay } from '@/date/day';
import { spacing, typography, usePalette } from '@/theme';
import { RoomChangeSheet } from '../components/RoomChangeSheet';
import { TeacherChangeSheet } from '../components/TeacherChangeSheet';
import { SessionRow } from '../components/SessionRow';
import { scheduleLabel } from '../format';
import { useDeleteModule, useModule, useModuleSessions } from '../hooks/useModules';

export function ModuleDetailScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const module = useModule(id);
  const sessions = useModuleSessions(id);
  const [sheet, setSheet] = useState<'room' | 'teacher' | 'delete' | null>(null);
  const remove = useDeleteModule(id);
  const day = (n: number) => t(`modules.daysShort.${n}`);
  const muted = [typography.body, { color: palette.textSecondary }];

  if (module.isPending) return <LoadingScreen />;
  if (module.isError) {
    return (
      <EmptyState
        title={t('modules.loadError')}
        description={errorMessage(t, module.error)}
        action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => module.refetch()} />}
      />
    );
  }
  const m = module.data;
  const { teacher, room } = m;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{m.name}</Text>
        {m.readOnlyReason ? <Banner message={t('modules.readOnly.PERIOD_CLOSED')} /> : null}
        {m.teacherUnavailable ? <Banner message={t('modules.unavailable.teacherHelp')} /> : null}
        {m.roomUnavailable ? <Banner message={t('modules.unavailable.roomHelp')} /> : null}

        <Card style={styles.card}>
          {m.description ? <Text style={muted}>{m.description}</Text> : null}
          <Text style={muted}>{`${t('modules.form.teacher')}: ${teacher.firstName} ${teacher.lastName}`}</Text>
          <Text style={muted}>{`${t('modules.form.room')}: ${room.locationName} · ${room.name}`}</Text>
          <Text style={muted}>{t('modules.card.cupo', { enrolled: m.enrolled, capacity: m.capacity })}</Text>
          {m.schedules.map((s) => (
            <Text key={s.id} style={muted}>{scheduleLabel(s, day)}</Text>
          ))}
          {m.holidayDates.length > 0 ? (
            <Text style={muted}>{t('modules.detail.holidays', { dates: m.holidayDates.map(formatDay).join(', ') })}</Text>
          ) : null}
        </Card>

        {m.readOnlyReason ? null : (
          <>
            <Button
              label={t('modules.edit.action')}
              icon="edit"
              variant="tonal"
              onPress={() => router.push({ pathname: '/modules/module-form', params: { id } })}
            />
            <Button label={t('modules.changeTeacher.action')} icon="swapTeacher" variant="tonal" onPress={() => setSheet('teacher')} />
            <Button label={t('modules.changeRoom.action')} icon="swapRoom" variant="tonal" onPress={() => setSheet('room')} />
            <Button
              label={t('modules.delete.action')}
              icon="trash"
              variant="outlined"
              disabled={!m.canDelete}
              helperText={m.canDelete ? undefined : t('errors.MODULE_HAS_ENROLLMENTS', { enrolled: m.enrolled })}
              onPress={() => setSheet('delete')}
            />
          </>
        )}

        <Text accessibilityRole="header" style={[typography.sectionTitle, { color: palette.textPrimary }]}>
          {t('modules.detail.sessions')}
        </Text>
        {sessions.isPending ? (
          <BrandLoader />
        ) : sessions.isError ? (
          <EmptyState
            title={t('modules.loadError')}
            description={errorMessage(t, sessions.error)}
            action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => sessions.refetch()} />}
          />
        ) : sessions.data.data.length === 0 ? (
          <Text style={muted}>{t('modules.detail.noSessions')}</Text>
        ) : (
          sessions.data.data.map((s) => <SessionRow key={s.id} session={s} />)
        )}
      </ScrollView>
      <RoomChangeSheet module={m} visible={sheet === 'room'} onClose={() => setSheet(null)} />
      <TeacherChangeSheet module={m} visible={sheet === 'teacher'} onClose={() => setSheet(null)} />
      {sheet === 'delete' ? (
        <ConfirmDialog
          title={t('modules.delete.title')}
          message={t('modules.delete.message')}
          confirmLabel={t('modules.delete.confirm')}
          confirmIcon="trash"
          loading={remove.isPending}
          onConfirm={() => remove.mutate(undefined, { onSuccess: () => router.back(), onError: () => setSheet(null) })}
          onCancel={() => setSheet(null)}
        />
      ) : null}
      {remove.error ? <Banner message={errorMessage(t, remove.error)} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { gap: spacing.sm },
});
