import type { EnrollmentItem, StudentModule, StudentModuleDetail, StudentSession } from '@/api/types';

export const offerPage = (data: StudentModule[], periodId: string | null = 'p1') => ({
  data,
  meta: { page: 1, limit: 100, total: data.length, periodId },
});

export const offerOf = (overrides: Partial<StudentModule> = {}): StudentModule => ({
  id: 'm1',
  name: 'Cálculo I',
  description: 'Refuerzo de límites',
  teacher: { id: 't1', firstName: 'Ana', lastName: 'Pérez' },
  room: { id: 'r1', name: 'A-101', location: 'Sede Central', capacity: 30 },
  schedules: [{ dayOfWeek: 2, startTime: '14:00', endTime: '16:00' }],
  capacity: 30,
  availableSeats: 12,
  state: 'AVAILABLE',
  blockReason: null,
  conflict: null,
  enrollment: null,
  ...overrides,
});

export const sessionOf = (overrides: Partial<StudentSession> = {}): StudentSession => ({
  id: 's1',
  startsAt: '2030-01-08T19:00:00.000Z',
  endsAt: '2030-01-08T21:00:00.000Z',
  status: 'SCHEDULED',
  cancelReason: null,
  cancelledByStudent: false,
  freeSeats: 5,
  canCancel: true,
  canRestore: false,
  blockReason: null,
  ...overrides,
});

export const detailOf = (overrides: Partial<StudentModuleDetail> = {}): StudentModuleDetail => ({
  ...offerOf(),
  readOnly: false,
  cancelLeadMinutes: 60,
  sessions: [sessionOf()],
  ...overrides,
});

export const itemOf = (overrides: Partial<EnrollmentItem> = {}): EnrollmentItem => ({
  id: 'e1',
  moduleId: 'm1',
  status: 'ACTIVE',
  enrolledAt: '2030-01-02T15:00:00.000Z',
  cancelledAt: null,
  effectiveUntil: null,
  module: offerOf({ state: 'ENROLLED', enrollment: { id: 'e1', enrolledAt: '2030-01-02T15:00:00.000Z' } }),
  readOnly: false,
  nextSession: sessionOf(),
  upcomingSessions: 8,
  ...overrides,
});

export const itemsPage = (data: EnrollmentItem[]) => ({ data, meta: { page: 1, limit: 100, total: data.length } });
