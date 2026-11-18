import type { Module, ModuleDetail, Session } from '@/api/types';

export const page = <T>(data: T[], extra: object = {}) => ({
  data,
  meta: { page: 1, limit: 100, total: data.length, ...extra },
});

export const periodOf = (overrides: object = {}) => ({
  id: 'p1',
  name: '2030-1',
  startsOn: '2030-01-07',
  endsOn: '2030-03-03',
  status: 'ACTIVE',
  closedAt: null,
  closedBy: null,
  hasModules: true,
  ...overrides,
});

export const moduleOf = (overrides: Partial<Module> = {}): Module => ({
  id: 'm1',
  periodId: 'p1',
  periodStatus: 'ACTIVE',
  name: 'Cálculo I',
  teacher: { id: 't1', firstName: 'Ana', lastName: 'Pérez' },
  room: { id: 'r1', name: 'A-101', locationName: 'Sede Central', capacity: 25 },
  capacity: 25,
  enrolled: 7,
  schedules: [{ dayOfWeek: 2, startTime: '14:00', endTime: '16:00' }],
  roomUnavailable: false,
  teacherUnavailable: false,
  ...overrides,
});

export const detailOf = (overrides: Partial<ModuleDetail> = {}): ModuleDetail => ({
  ...moduleOf(),
  description: 'Refuerzo de límites',
  schedules: [{ id: 's1', dayOfWeek: 2, startTime: '14:00', endTime: '16:00' }],
  holidayDates: [],
  canChangeSchedules: false,
  canDelete: false,
  readOnlyReason: null,
  ...overrides,
});

export const sessionOf = (overrides: Partial<Session> = {}): Session => ({
  id: 'x1',
  startsAt: '2030-01-08T19:00:00.000Z', // 14:00 in Bogota
  endsAt: '2030-01-08T21:00:00.000Z',
  originalStartsAt: '2030-01-08T19:00:00.000Z',
  status: 'SCHEDULED',
  cancelReason: null,
  teacher: { id: 't1', firstName: 'Ana', lastName: 'Pérez' },
  room: { id: 'r1', name: 'A-101', locationName: 'Sede Central', capacity: 25 },
  ...overrides,
});

export const roomOf = (overrides: object = {}) => ({
  id: 'r2',
  locationId: 'l1',
  locationName: 'Sede Central',
  name: 'B-201',
  capacity: 40,
  status: 'ACTIVE',
  ...overrides,
});
