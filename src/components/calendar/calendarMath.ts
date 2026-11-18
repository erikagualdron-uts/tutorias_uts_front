import { addDays, compareDays } from '@/date/day';
import { bogotaDay, bogotaParts } from '@/features/modules/format';
import { calendarLayout } from '@/theme';
import type { CalendarHours, CalendarItem, CalendarPeriodRange } from './types';

const DAY_MINUTES = 24 * 60;
const MIN_SPAN_MINUTES = 30;

export const minuteOf = (time: string): number => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

// Monday (YYYY-MM-DD) of the week of a calendar day; weeks run Monday to Sunday.
export function weekStartOf(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(day, -((weekday + 6) % 7));
}

export const weekDaysOf = (start: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(start, i));

// 1 = Monday ... 7 = Sunday, the numbering of the day names in the translations.
export const isoWeekday = (day: string): number => ((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;

// Keeps a week inside the period: never before the week of its first day or after the week of its last.
export function clampWeek(start: string, period: CalendarPeriodRange | null): string {
  if (!period) return start;
  const first = weekStartOf(period.startsOn);
  const last = weekStartOf(period.endsOn);
  if (compareDays(start, first) < 0) return first;
  if (compareDays(start, last) > 0) return last;
  return start;
}

// Whether the arrow can move a week; without a period there is nothing to move to.
export function canMoveWeek(start: string, direction: -1 | 1, period: CalendarPeriodRange | null): boolean {
  if (!period) return false;
  const target = addDays(start, direction * 7);
  return clampWeek(target, period) === target;
}

// The week to open on: the one of today, or the closest one of the period when today is outside it.
export const initialWeek = (today: string, period: CalendarPeriodRange | null): string =>
  clampWeek(weekStartOf(today), period);

// The day shown when the week changes: today if it is in the week, otherwise the same weekday as before.
export function selectDayForWeek(start: string, today: string, previous: string): string {
  const days = weekDaysOf(start);
  if (days.includes(today)) return today;
  return days[isoWeekday(previous) - 1] ?? days[0];
}

// The Bogota day and minute of the day of an instant, whatever the time zone of the device.
export const placeInBogota = (iso: string): { day: string; minute: number } => ({
  day: bogotaDay(iso),
  minute: minuteOf(bogotaParts(iso).time),
});

export interface ItemSpan {
  day: string;
  start: number;
  end: number;
}

// The minutes a session covers in its Bogota day; one that runs past midnight is cut at the end of the day.
export function itemSpan(item: Pick<CalendarItem, 'startsAt' | 'endsAt'>): ItemSpan {
  const start = placeInBogota(item.startsAt);
  const end = placeInBogota(item.endsAt);
  const last = end.day === start.day ? end.minute : DAY_MINUTES;
  return { day: start.day, start: start.minute, end: Math.max(last, start.minute + MIN_SPAN_MINUTES) };
}

export interface HourRange {
  start: number;
  end: number;
}

// Whole hours from the allowed hours, widened to show every session completely.
export function visibleRange(hours: CalendarHours, items: readonly CalendarItem[]): HourRange {
  let start = minuteOf(hours.earliest);
  let end = minuteOf(hours.latest);
  for (const item of items) {
    const span = itemSpan(item);
    start = Math.min(start, span.start);
    end = Math.max(end, span.end);
  }
  return { start: Math.floor(start / 60) * 60, end: Math.min(DAY_MINUTES, Math.ceil(end / 60) * 60) };
}

export const rangeHeight = (range: HourRange): number => ((range.end - range.start) / 60) * calendarLayout.hourHeight;

// Top and height of a block in a column that starts at `range.start`.
export function blockPosition(span: ItemSpan, range: HourRange): { top: number; height: number } {
  const per = calendarLayout.hourHeight / 60;
  return {
    top: (span.start - range.start) * per,
    height: Math.max(calendarLayout.minBlockHeight, (span.end - span.start) * per),
  };
}

// Sessions that overlap share the width of the column in equal parts; none covers another.
export function layoutOverlaps(items: readonly CalendarItem[]): Map<string, { column: number; columns: number }> {
  const spans = items
    .map((item) => ({ id: item.id, ...itemSpan(item) }))
    .sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
  const result = new Map<string, { column: number; columns: number }>();
  let cluster: typeof spans = [];
  let clusterEnd = -1;
  const flush = () => {
    const ends: number[] = [];
    const placed = cluster.map((span) => {
      let column = ends.findIndex((end) => end <= span.start);
      if (column === -1) column = ends.length;
      ends[column] = span.end;
      return { id: span.id, column };
    });
    for (const { id, column } of placed) result.set(id, { column, columns: ends.length });
  };
  for (const span of spans) {
    if (cluster.length > 0 && span.start >= clusterEnd) {
      flush();
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(span);
    clusterEnd = Math.max(clusterEnd, span.end);
  }
  if (cluster.length > 0) flush();
  return result;
}

// The days (Bogota) with at least one session, whatever its state.
export const daysWithSessions = (items: readonly CalendarItem[]): Set<string> =>
  new Set(items.map((item) => bogotaDay(item.startsAt)));

export function sessionCounts(items: readonly CalendarItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const day = bogotaDay(item.startsAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

export const itemsOfDay = (items: readonly CalendarItem[], day: string): CalendarItem[] =>
  items
    .filter((item) => bogotaDay(item.startsAt) === day)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id));

// Where the line of the current hour goes, or null when it is outside the visible hours.
export function nowOffset(now: Date, range: HourRange): number | null {
  const minute = minuteOf(bogotaParts(now.toISOString()).time);
  if (minute < range.start || minute > range.end) return null;
  return ((minute - range.start) / 60) * calendarLayout.hourHeight;
}
