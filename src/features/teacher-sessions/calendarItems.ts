import type { TFunction } from 'i18next';
import type { TeacherSession } from '@/api/types';
import type { CalendarItem } from '@/components/calendar/types';
import { bogotaParts } from '@/features/modules/format';

// The key of the state of a session in `teacher.schedule.state.*`.
export function sessionStateKey(session: TeacherSession) {
  if (session.status === 'CANCELLED') return session.cancelReason === 'TEACHER' ? 'TEACHER' : 'HOLIDAY';
  return session.status;
}

// A session of the teacher as the calendar draws it: module, room, attendees and its state as text.
export function toCalendarItem(session: TeacherSession, t: TFunction): CalendarItem {
  const original = bogotaParts(session.originalStartsAt);
  return {
    id: session.id,
    title: session.moduleName,
    room: session.room.name,
    detail: t('teacher.schedule.attendees', { attendees: session.attendees }),
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    status: session.status,
    badge: t(`teacher.schedule.state.${sessionStateKey(session)}`),
    note:
      session.status === 'RESCHEDULED'
        ? t('teacher.schedule.original', { time: original.time, date: original.date })
        : undefined,
    strike: session.status === 'CANCELLED',
  };
}
