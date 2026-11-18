import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TeacherCalendar, TeacherSession } from '@/api/types';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { initialWeek, selectDayForWeek, weekStartOf } from '@/components/calendar/calendarMath';
import type { CalendarView } from '@/components/calendar/types';
import { useNow } from '@/components/calendar/useNow';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { addDays, todayInBogota } from '@/date/day';
import { bogotaParts, scheduleLabel } from '@/features/modules/format';
import { calendarLayout, spacing, typography, usePalette } from '@/theme';
import { toCalendarItem } from '../calendarItems';
import { SessionActionsSheet } from '../components/SessionActionsSheet';
import { TeacherSessionCard } from '../components/TeacherSessionCard';
import { useTeacherCalendar } from '../hooks/useTeacherCalendar';
import { useTeacherModules, useTeacherSessions } from '../hooks/useTeacherSessions';

// Nothing is drawn with these hours: they only stand in while the first week loads.
const UNKNOWN_HOURS = { earliest: '00:00', latest: '00:00' };

// The teacher Schedule tab: the weekly calendar, then the upcoming sessions and the modules they dictate.
export function TeacherScheduleScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { width } = useWindowDimensions();
  const now = useNow();
  const today = todayInBogota(now);
  const [week, setWeek] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>(width >= calendarLayout.tabletMinWidth ? 'week' : 'day');
  const [meta, setMeta] = useState<TeacherCalendar['meta']>();
  const [moduleId, setModuleId] = useState<string>();
  const [picked, setPicked] = useState<string | null>(null);

  const weekStart = week ?? weekStartOf(today);
  const selectedDay = selected ?? selectDayForWeek(weekStart, today, today);
  const calendar = useTeacherCalendar(weekStart, addDays(weekStart, 6));
  const modules = useTeacherModules();
  const sessions = useTeacherSessions(moduleId);
  const day = (n: number) => t(`modules.daysShort.${n}`);

  // The period comes with every week. Keep the last one while another loads, and the first time open on the
  // week of the period closest to today when today is outside it (state adjusted while rendering).
  if (calendar.data && !calendar.isPlaceholderData && calendar.data.meta !== meta) {
    setMeta(calendar.data.meta);
    if (week === null) {
      const start = initialWeek(today, calendar.data.meta.period);
      setWeek(start);
      if (start !== weekStart) setSelected(selectDayForWeek(start, today, today));
    }
  }

  const shown = calendar.isPlaceholderData ? [] : (calendar.data?.data ?? []);
  const groups = new Map<string, TeacherSession[]>();
  for (const session of sessions.data?.data ?? []) {
    const key = bogotaParts(session.startsAt).date;
    groups.set(key, [...(groups.get(key) ?? []), session]);
  }
  const current = [...shown, ...(sessions.data?.data ?? [])].find((s) => s.id === picked);

  const retry = <Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => calendar.refetch()} />;
  const body = calendar.isError ? (
    <EmptyState title={t('calendar.loadError')} description={errorMessage(t, calendar.error)} action={retry} />
  ) : calendar.isPending || calendar.isPlaceholderData ? (
    <BrandLoader />
  ) : calendar.data.meta.period === null ? (
    <EmptyState title={t('calendar.noPeriod')} description={t('teacher.schedule.empty.description')} />
  ) : undefined;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('teacher.schedule.title')}</Text>

        <Card>
          <WeekCalendar
            weekStart={weekStart}
            selectedDay={selectedDay}
            today={today}
            now={now}
            view={view}
            items={shown.map((s) => toCalendarItem(s, t))}
            hours={meta?.hours ?? UNKNOWN_HOURS}
            period={meta?.period}
            onWeekChange={(start, picked) => {
              setWeek(start);
              setSelected(picked);
            }}
            onSelectDay={setSelected}
            onViewChange={setView}
            onPressItem={setPicked}
            body={body}
          />
        </Card>

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

        <Text accessibilityRole="header" style={[typography.sectionTitle, { color: palette.textPrimary }]}>
          {t('teacher.schedule.myModules')}
        </Text>
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
      </ScrollView>

      {current ? (
        <SessionActionsSheet
          session={current}
          minutes={meta?.changeLeadMinutes ?? sessions.data?.meta.changeLeadMinutes ?? 120}
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
