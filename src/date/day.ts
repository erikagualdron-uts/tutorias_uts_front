// Calendar days (no hour, no time zone). A day is the text YYYY-MM-DD: it is the value kept in
// forms and sent to the API, so it never goes through a time zone conversion (D-079, D-080).

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DayParts {
  year: number;
  month: number;
  day: number;
}

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

export function parseDay(value: string): DayParts | null {
  const match = DAY_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export const isValidDay = (value: string): boolean => parseDay(value) !== null;

const stringify = ({ year, month, day }: DayParts) =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

// dd/mm/YYYY in every language. Empty when the value is empty or not a real day.
export function formatDay(value: string): string {
  const parts = parseDay(value);
  return parts
    ? `${pad(parts.day)}/${pad(parts.month)}/${pad(parts.year, 4)}`
    : '';
}

// The picker returns a Date in the device time zone: only its local year, month and day matter.
export const toDay = (date: Date): string =>
  stringify({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

// Noon local time, so a daylight saving or zone shift can never move the day.
export function dayToDate(value: string): Date | undefined {
  const parts = parseDay(value);
  return parts
    ? new Date(parts.year, parts.month - 1, parts.day, 12)
    : undefined;
}

export function addDays(value: string, amount: number): string {
  const parts = parseDay(value);
  if (!parts) return value;
  const moved = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + amount),
  );
  return stringify({
    year: moved.getUTCFullYear(),
    month: moved.getUTCMonth() + 1,
    day: moved.getUTCDate(),
  });
}

// Both values must be valid days; ISO text sorts the same as the calendar.
export function compareDays(a: string, b: string): -1 | 0 | 1 {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

// Today in America/Bogota. Falls back to the device day if the engine lacks the zone.
export function todayInBogota(now: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    if (isValidDay(formatted)) return formatted;
  } catch {
    // Use the device day below.
  }
  return toDay(now);
}
