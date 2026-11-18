import type { TeacherModule, TeacherSession } from '@/api/types';

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
