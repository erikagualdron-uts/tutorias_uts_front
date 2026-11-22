import type { TFunction } from 'i18next';
import type { StudentCalendarSession } from '@/api/types';
import type { CalendarItem } from '@/components/calendar/types';
import { bogotaParts } from '@/features/modules/format';

// The key of the state of a session in `student.schedule.state.*`. The cause that the institution gave (a holiday,
// the teacher) is more useful than the student's own choice, so it comes first.
export function sessionStateKey(session: StudentCalendarSession) {
  if (session.status === 'CANCELLED') return session.cancelReason === 'TEACHER' ? 'TEACHER' : 'HOLIDAY';
  return session.absent ? 'STUDENT' : session.status;
}

// A session of the student as the calendar draws it: module, room, teacher and its state as text.
export function toCalendarItem(session: StudentCalendarSession, t: TFunction): CalendarItem {
  const key = sessionStateKey(session);
  const original = bogotaParts(session.originalStartsAt);
  const cancelled = key === 'HOLIDAY' || key === 'TEACHER' || key === 'STUDENT';
  return {
    id: session.id,
    title: session.moduleName,
    room: session.room.name,
    detail: session.teacherName,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    status: cancelled ? 'CANCELLED' : session.status,
    badge: t(`student.schedule.state.${key}`),
    note: key === 'RESCHEDULED' ? t('student.schedule.original', { time: original.time, date: original.date }) : undefined,
    strike: cancelled,
  };
}
