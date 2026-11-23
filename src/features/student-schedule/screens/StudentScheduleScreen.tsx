import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useWeekNavigation } from '@/components/calendar/useWeekNavigation';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { EmptyState } from '@/components/EmptyState';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { targetFor } from '@/features/notifications/openTarget';
import { spacing, usePalette } from '@/theme';
import { toCalendarItem } from '../calendarItems';
import { useStudentCalendar } from '../hooks/useStudentCalendar';

// Nothing is drawn with these hours: they only stand in while the first week loads.
const UNKNOWN_HOURS = { earliest: '00:00', latest: '00:00' };

// The student Schedule tab (spec 021): the weekly calendar of the sessions where they attend, read only.
// Tapping a session opens its module, where the student already cancels under the usual rules.
export function StudentScheduleScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { calendar, meta, now, today, weekStart, selectedDay, view, onViewChange, onSelectDay, onWeekChange } =
    useWeekNavigation(useStudentCalendar);
  const { refetch } = calendar;
  useRefreshOnFocus(refetch);

  const shown = calendar.isPlaceholderData ? [] : (calendar.data?.data ?? []);
  const loaded = calendar.data && !calendar.isPlaceholderData ? calendar.data.meta : null;
  const explore = <Button label={t('student.schedule.empty.action')} icon="modules" onPress={() => router.push('/(student)/modules' as Href)} />;
  const body = calendar.isError ? (
    <EmptyState
      title={t('calendar.loadError')}
      description={errorMessage(t, calendar.error)}
      action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => refetch()} />}
    />
  ) : calendar.isPending || calendar.isPlaceholderData ? (
    <BrandLoader />
  ) : calendar.data.meta.period === null ? (
    <EmptyState title={t('calendar.noPeriod')} description={t('student.schedule.noPeriodHint')} />
  ) : undefined;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          {loaded?.period && !loaded.hasEnrollments ? (
            <EmptyState title={t('student.schedule.empty.title')} description={t('student.schedule.empty.description')} action={explore} />
          ) : (
            <WeekCalendar
              weekStart={weekStart}
              selectedDay={selectedDay}
              today={today}
              now={now}
              view={view}
              items={shown.map((s) => toCalendarItem(s, t))}
              hours={meta?.hours ?? UNKNOWN_HOURS}
              period={meta?.period}
              onWeekChange={onWeekChange}
              onSelectDay={onSelectDay}
              onViewChange={onViewChange}
              onPressItem={(id) => {
                const session = shown.find((s) => s.id === id);
                if (session) router.push(targetFor('STUDENT', session.moduleId));
              }}
              body={body}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
