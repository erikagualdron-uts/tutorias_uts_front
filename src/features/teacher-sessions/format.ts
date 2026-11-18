import { addDays } from '@/date/day';

// Monday and Sunday (YYYY-MM-DD) of the week of a calendar day, the days a session can move to.
export function weekBounds(day: string): { from: string; to: string } {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const monday = addDays(day, -((weekday + 6) % 7));
  return { from: monday, to: addDays(monday, 6) };
}

// A Bogota day and hour (YYYY-MM-DD and HH:mm) as the UTC instant the API expects.
export const toUtcIso = (day: string, time: string): string => new Date(`${day}T${time}:00-05:00`).toISOString();
