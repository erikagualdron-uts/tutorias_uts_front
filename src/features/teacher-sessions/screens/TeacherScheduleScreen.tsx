import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TeacherSession } from '@/api/types';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { bogotaParts, scheduleLabel } from '@/features/modules/format';
import { spacing, typography, usePalette } from '@/theme';
import { SessionActionsSheet } from '../components/SessionActionsSheet';
import { TeacherSessionCard } from '../components/TeacherSessionCard';
import { useTeacherModules, useTeacherSessions } from '../hooks/useTeacherSessions';

// The teacher Schedule tab: the modules they dictate and their upcoming sessions, day by day.
export function TeacherScheduleScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const [moduleId, setModuleId] = useState<string>();
  const [picked, setPicked] = useState<string | null>(null);
  const modules = useTeacherModules();
  const sessions = useTeacherSessions(moduleId);
  const day = (n: number) => t(`modules.daysShort.${n}`);

  const groups = new Map<string, TeacherSession[]>();
  for (const session of sessions.data?.data ?? []) {
    const key = bogotaParts(session.startsAt).date;
    groups.set(key, [...(groups.get(key) ?? []), session]);
  }
  const current = sessions.data?.data.find((s) => s.id === picked);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('teacher.schedule.title')}</Text>

        {modules.data?.data.map((m) => (
          <Card key={m.id} style={styles.module}>
            <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{m.name}</Text>
            <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
              {`${m.schedules.map((s) => scheduleLabel(s, day)).join(' · ')} · ${m.room.name}`}
            </Text>
            <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
              {t('teacher.schedule.enrolled', { enrolled: m.enrolled, capacity: m.capacity })}
            </Text>
          </Card>
        ))}

        {modules.data && modules.data.data.length > 1 ? (
          <FilterChips<string>
            options={[
              { value: undefined, label: t('teacher.schedule.all') },
              ...modules.data.data.map((m) => ({ value: m.id, label: m.name })),
            ]}
            value={moduleId}
            onChange={setModuleId}
          />
        ) : null}

        <Text accessibilityRole="header" style={[typography.sectionTitle, { color: palette.textPrimary }]}>
          {t('teacher.schedule.sessions')}
        </Text>
        {sessions.isPending ? (
          <BrandLoader />
        ) : sessions.isError ? (
          <EmptyState
            title={t('teacher.schedule.loadError')}
            description={errorMessage(t, sessions.error)}
            action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => sessions.refetch()} />}
          />
        ) : sessions.data.data.length === 0 ? (
          <EmptyState title={t('teacher.schedule.empty.title')} description={t('teacher.schedule.empty.description')} />
        ) : (
          [...groups.entries()].map(([date, items]) => (
            <View key={date} style={styles.group}>
              <Text style={[typography.label, { color: palette.textSecondary }]}>{date}</Text>
              {items.map((session) => (
                <TeacherSessionCard key={session.id} session={session} onPress={() => setPicked(session.id)} />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {current ? (
        <SessionActionsSheet
          session={current}
          minutes={sessions.data?.meta.changeLeadMinutes ?? 120}
          onClose={() => setPicked(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  module: { gap: spacing.xs },
  group: { gap: spacing.sm },
});
