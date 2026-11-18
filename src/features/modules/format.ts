import type { ScheduleInput } from '@/api/types';
import { formatDay } from '@/date/day';

const BOGOTA_OFFSET_MS = 5 * 3_600_000; // America/Bogota is UTC-5 all year

// ISO instant (UTC) to the date and time shown to people, in Bogota.
export function bogotaParts(iso: string): { date: string; time: string } {
  const local = new Date(Date.parse(iso) - BOGOTA_OFFSET_MS).toISOString();
  return { date: formatDay(local.slice(0, 10)), time: local.slice(11, 16) };
}

// "Mar 14:00–16:00"; `day` translates a day number to its short name.
export const scheduleLabel = (s: ScheduleInput, day: (n: number) => string) =>
  `${day(s.dayOfWeek)} ${s.startTime}–${s.endTime}`;
