import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { addDays, todayInBogota } from '@/date/day';
import { calendarLayout } from '@/theme';
import { initialWeek, selectDayForWeek, weekStartOf } from './calendarMath';
import type { CalendarPeriodRange, CalendarView } from './types';
import { useNow } from './useNow';

type WeekQuery = { data: { meta: { period: CalendarPeriodRange | null } } | undefined; isPlaceholderData: boolean };

// Where the weekly calendar is (week, day, view) and the query of that week; the same for every role (specs 013 and 021).
// `useWeek` is the query hook of the role: it receives the Monday and the Sunday of the visible week.
export function useWeekNavigation<TQuery extends WeekQuery>(useWeek: (from: string, to: string) => TQuery) {
  const { width } = useWindowDimensions();
  const now = useNow();
  const today = todayInBogota(now);
  const [week, setWeek] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>(width >= calendarLayout.tabletMinWidth ? 'week' : 'day');
  const [meta, setMeta] = useState<NonNullable<TQuery['data']>['meta']>();

  const weekStart = week ?? weekStartOf(today);
  const selectedDay = selected ?? selectDayForWeek(weekStart, today, today);
  const calendar = useWeek(weekStart, addDays(weekStart, 6));

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

  return {
    calendar,
    meta,
    now,
    today,
    weekStart,
    selectedDay,
    view,
    onViewChange: setView,
    onSelectDay: setSelected,
    onWeekChange: (start: string, day: string) => {
      setWeek(start);
      setSelected(day);
    },
  };
}
