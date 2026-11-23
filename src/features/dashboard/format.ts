import type { TFunction } from 'i18next';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "hace 5 min", "hace 3 h", "hace 2 d" for the moment of a change.
export function relativeTime(t: TFunction, iso: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - Date.parse(iso));
  if (diff < MINUTE) return t('dashboard.relative.now');
  if (diff < HOUR) return t('dashboard.relative.minutes', { count: Math.floor(diff / MINUTE) });
  if (diff < DAY) return t('dashboard.relative.hours', { count: Math.floor(diff / HOUR) });
  return t('dashboard.relative.days', { count: Math.floor(diff / DAY) });
}

// The average response time as one figure: minutes under an hour, hours under a day, otherwise days.
export function durationLabel(t: TFunction, seconds: number | null): string {
  if (seconds === null) return '—';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return t('dashboard.duration.minutes', { count: minutes });
  if (minutes < 1440) return t('dashboard.duration.hours', { count: Math.round(minutes / 60) });
  return t('dashboard.duration.days', { count: Math.round(minutes / 1440) });
}
