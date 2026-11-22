import type { StudentCalendar, StudentCalendarSession } from '@/api/types';

// Tuesday 2030-01-08, 14:00 to 16:00 in Bogota, scheduled, with the teacher of the module.
export const studentSessionOf = (overrides: Partial<StudentCalendarSession> = {}): StudentCalendarSession => ({
  id: 's1',
  moduleId: 'm1',
  moduleName: 'Cálculo I',
  teacherName: 'Ana Pérez',
  room: { id: 'r1', name: 'A-101', location: 'Sede Central', capacity: 30 },
  startsAt: '2030-01-08T19:00:00.000Z',
  endsAt: '2030-01-08T21:00:00.000Z',
  originalStartsAt: '2030-01-08T19:00:00.000Z',
  status: 'SCHEDULED',
  cancelReason: null,
  absent: false,
  ...overrides,
});

// A week of the calendar; by default the active period of 2030, the allowed hours of the API and an enrolled student.
export const calendarPage = (data: StudentCalendarSession[] = [], meta: Partial<StudentCalendar['meta']> = {}): StudentCalendar => ({
  data,
  meta: {
    from: '2030-01-07',
    to: '2030-01-13',
    period: { id: 'p1', name: '2030-1', startsOn: '2030-01-07', endsOn: '2030-03-03', status: 'ACTIVE' },
    hours: { earliest: '06:00', latest: '18:00' },
    hasEnrollments: true,
    ...meta,
  },
});
