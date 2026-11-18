import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeInView } from '@/components/FadeInView';
import { addDays } from '@/date/day';
import { spacing } from '@/theme';
import { CalendarHeader } from './CalendarHeader';
import {
  canMoveWeek,
  itemsOfDay,
  selectDayForWeek,
  sessionCounts,
  visibleRange,
  weekDaysOf,
  weekStartOf,
} from './calendarMath';
import { DayStrip } from './DayStrip';
import { DayTimeline } from './DayTimeline';
import type { CalendarHours, CalendarItem, CalendarPeriodRange, CalendarView } from './types';
import { WeekGrid } from './WeekGrid';

interface WeekCalendarProps {
  // Monday of the visible week and the day shown in the Day view (YYYY-MM-DD, Bogota).
  weekStart: string;
  selectedDay: string;
  today: string;
  now: Date;
  view: CalendarView;
  // Sessions of the visible week; empty while it loads.
  items: CalendarItem[];
  hours: CalendarHours;
  // undefined while the first week loads: the arrows wait, null when there is no period at all.
  period: CalendarPeriodRange | null | undefined;
  onWeekChange: (weekStart: string, selectedDay: string) => void;
  onSelectDay: (day: string) => void;
  onViewChange: (view: CalendarView) => void;
  onPressItem: (id: string) => void;
  // Replaces the sessions (loading, error or no period): the header and the week stay where they are.
  body?: ReactNode;
}

// The weekly calendar: header, week strip and either the day timeline or the seven columns. It knows nothing
// about who owns the sessions, so the student and the CAE can use it later (spec 013, FR-015).
export function WeekCalendar({
  weekStart,
  selectedDay,
  today,
  now,
  view,
  items,
  hours,
  period,
  onWeekChange,
  onSelectDay,
  onViewChange,
  onPressItem,
  body,
}: WeekCalendarProps) {
  const [outsidePeriod, setOutsidePeriod] = useState(false);
  const days = weekDaysOf(weekStart);
  const range = visibleRange(hours, items);

  const move = (direction: -1 | 1) => {
    if (period === undefined) return;
    if (!canMoveWeek(weekStart, direction, period)) {
      setOutsidePeriod(true);
      return;
    }
    setOutsidePeriod(false);
    const start = addDays(weekStart, direction * 7);
    onWeekChange(start, selectDayForWeek(start, today, selectedDay));
  };

  return (
    <View style={styles.box}>
      <CalendarHeader
        weekStart={weekStart}
        canPrevious={period !== undefined && canMoveWeek(weekStart, -1, period)}
        canNext={period !== undefined && canMoveWeek(weekStart, 1, period)}
        onPrevious={() => move(-1)}
        onNext={() => move(1)}
        onToday={() => {
          setOutsidePeriod(false);
          onWeekChange(weekStartOf(today), today);
        }}
        view={view}
        onView={onViewChange}
        outsidePeriod={outsidePeriod}
      />
      {view === 'day' ? (
        <DayStrip days={days} selected={selectedDay} today={today} counts={sessionCounts(items)} onSelect={onSelectDay} />
      ) : null}
      {body ?? (
        <FadeInView key={`${view}-${weekStart}-${selectedDay}`}>
          {view === 'day' ? (
            <DayTimeline
              items={itemsOfDay(items, selectedDay)}
              range={range}
              now={selectedDay === today ? now : null}
              onPressItem={onPressItem}
            />
          ) : (
            <WeekGrid days={days} items={items} range={range} today={today} now={now} onPressItem={onPressItem} />
          )}
        </FadeInView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ box: { gap: spacing.lg } });
