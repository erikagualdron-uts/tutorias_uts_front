import type { TeacherCalendar, TeacherModule, TeacherSession } from '@/api/types';

export const teacherSessionOf = (overrides: Partial<TeacherSession> = {}): TeacherSession => ({
  id: 's1',
  moduleId: 'm1',
  moduleName: 'Cálculo I',
  startsAt: '2030-01-08T19:00:00.000Z',
  endsAt: '2030-01-08T21:00:00.000Z',
  originalStartsAt: '2030-01-08T19:00:00.000Z',
  status: 'SCHEDULED',
  cancelReason: null,
  room: { id: 'r1', name: 'A-101', location: 'Sede Central', capacity: 30 },
  attendees: 12,
  canReschedule: true,
  canCancel: true,
  canRestore: false,
  blockReason: null,
  ...overrides,
});

export const teacherModuleOf = (overrides: Partial<TeacherModule> = {}): TeacherModule => ({
  id: 'm1',
  name: 'Cálculo I',
  description: null,
  room: { id: 'r1', name: 'A-101', location: 'Sede Central', capacity: 30 },
  schedules: [{ dayOfWeek: 2, startTime: '14:00', endTime: '16:00' }],
  enrolled: 12,
  capacity: 30,
  readOnly: false,
  nextSession: null,
  ...overrides,
});

export const modulesPage = (data: TeacherModule[]) => ({
  data,
  meta: { page: 1, limit: 100, total: data.length, periodId: 'p1' },
});

export const sessionsPage = (data: TeacherSession[]) => ({
  data,
  meta: { page: 1, limit: 100, total: data.length, changeLeadMinutes: 120 },
});

// A week of the calendar; by default the active period of 2030 and the allowed hours of the API.
export const calendarPage = (data: TeacherSession[] = [], meta: Partial<TeacherCalendar['meta']> = {}): TeacherCalendar => ({
  data,
  meta: {
    from: '2030-01-07',
    to: '2030-01-13',
    period: { id: 'p1', name: '2030-1', startsOn: '2030-01-07', endsOn: '2030-03-03', status: 'ACTIVE' },
    hours: { earliest: '06:00', latest: '18:00' },
    changeLeadMinutes: 120,
    ...meta,
  },
});
