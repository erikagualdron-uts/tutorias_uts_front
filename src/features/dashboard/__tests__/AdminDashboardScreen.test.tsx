import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useFocusEffect: jest.fn() }));

const mockedApi = api as jest.Mock;
const overview = (overrides: object = {}) => ({
  occupancy: { enrolled: 17, capacity: 30, percent: 56.7 },
  modules: { active: 3, full: 1, lowEnrollment: 1 },
  lowEnrollmentPercent: 30,
  accounts: { students: 40, teachers: 6 },
  pqrs: { filed: 2, inReview: 1, resolved: 3, avgResponseSeconds: 7200 },
  ...overrides,
});
const change = (n: number, kind = 'CANCELLED') => ({
  sessionId: `s${n}`,
  moduleId: `m${n}`,
  moduleName: `Módulo ${n}`,
  kind,
  originalStartsAt: '2030-03-05T15:00:00.000Z',
  startsAt: '2030-03-05T15:00:00.000Z',
  changedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
});
const room = (name: string, percent: number) => ({ roomId: name, name, location: 'Sede Central', percent, modules: 2 });
const routes = (handlers: Record<string, unknown>) =>
  mockedApi.mockImplementation((path: string) => {
    const hit = Object.entries(handlers).find(([pattern]) => path.startsWith(pattern));
    if (!hit) return Promise.reject(new Error(path));
    return hit[1] instanceof Error ? Promise.reject(hit[1]) : Promise.resolve(hit[1]);
  });
const full = {
  '/dashboard/admin/overview': overview(),
  '/dashboard/admin/changes': { data: [change(1), change(2, 'RESCHEDULED')], meta: { page: 1, limit: 5, total: 2 } },
  '/dashboard/admin/rooms': { most: [room('Alta', 90)], least: [room('Baja', 10)] },
};
const renderScreen = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('AdminDashboardScreen', () => {
  it('shows the occupancy, the counters, the PQRS by state, the changes and the rooms', async () => {
    routes(full);
    await renderScreen(<AdminDashboardScreen />);
    expect(await screen.findByText('1 módulo lleno · 1 con baja inscripción')).toBeTruthy();
    expect(screen.getByText('56.7 %')).toBeTruthy();
    expect(screen.getByText('17 de 30 cupos')).toBeTruthy();
    for (const label of ['Módulos activos', 'Estudiantes activos', 'Docentes activos', 'PQRS radicadas']) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
    // every state is written with its number, not only colored
    for (const label of ['Radicada', 'En revisión', 'Resuelta']) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText('2 h')).toBeTruthy();
    expect(screen.getByText('Cancelada · hace 5 min')).toBeTruthy();
    expect(screen.getByText('Reprogramada · hace 5 min')).toBeTruthy();
    expect(screen.getByText('Módulo 1')).toBeTruthy();
    expect(screen.getByText('Alta')).toBeTruthy();
    expect(screen.getAllByText('Sede Central · 2 módulos')).toHaveLength(2);
  });

  it('writes the same in English', async () => {
    await i18n.changeLanguage('en');
    routes(full);
    await renderScreen(<AdminDashboardScreen />);
    expect(await screen.findByText('1 module full · 1 with low enrollment')).toBeTruthy();
    expect(screen.getByText('Average response time')).toBeTruthy();
  });

  it('keeps the other blocks when one fails and offers to retry it', async () => {
    routes({ ...full, '/dashboard/admin/rooms': new ApiError(500, 'INTERNAL_ERROR') });
    await renderScreen(<AdminDashboardScreen />);
    expect(await screen.findByText('No pudimos cargar este bloque')).toBeTruthy();
    expect(screen.getByText('Intentar de nuevo')).toBeTruthy();
    expect(screen.getByText('56.7 %')).toBeTruthy();
    expect(screen.getByText('Módulo 1')).toBeTruthy();
  });

  it('shows the empty state of each block and a dash without resolved PQRS', async () => {
    routes({
      '/dashboard/admin/overview': overview({
        occupancy: { enrolled: 0, capacity: 0, percent: 0 },
        modules: { active: 0, full: 0, lowEnrollment: 0 },
        pqrs: { filed: 0, inReview: 0, resolved: 0, avgResponseSeconds: null },
      }),
      '/dashboard/admin/changes': { data: [], meta: { page: 1, limit: 5, total: 0 } },
      '/dashboard/admin/rooms': { most: [], least: [] },
    });
    await renderScreen(<AdminDashboardScreen />);
    expect(await screen.findByText('Aún no hay módulos activos en el periodo vigente.')).toBeTruthy();
    expect(screen.getByText('Aún no hay PQRS radicadas.')).toBeTruthy();
    expect(screen.getByText('No hay cancelaciones ni reprogramaciones recientes.')).toBeTruthy();
    expect(screen.getByText('Aún no hay módulos con salón asignado.')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });
});
