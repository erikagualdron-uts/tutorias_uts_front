import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { StudentModuleDetailScreen } from '../screens/StudentModuleDetailScreen';
import { StudentModulesScreen } from '../screens/StudentModulesScreen';
import { detailOf, offerOf, offerPage } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'm1' }),
}));

const mockedApi = api as jest.Mock;
let offer: (path: string) => Promise<unknown>;
let detail: () => Promise<unknown>;
let enroll: () => Promise<unknown>;

const renderScreen = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

beforeEach(async () => {
  jest.clearAllMocks();
  offer = () => Promise.resolve(offerPage([offerOf()]));
  detail = () => Promise.resolve(detailOf());
  enroll = () => Promise.resolve({ id: 'e1', moduleId: 'm1', status: 'ACTIVE' });
  mockedApi.mockImplementation((path: string, options?: { method?: string }) => {
    if (options?.method === 'POST') return enroll();
    if (path.startsWith('/student/modules/')) return detail();
    if (path.startsWith('/student/modules')) return offer(path);
    return Promise.resolve({ data: [], meta: { page: 1, limit: 100, total: 0 } });
  });
  await i18n.changeLanguage('es');
});

describe('offer cards', () => {
  it('shows teacher, schedule, room and occupied/capacity with the Enroll action', async () => {
    await renderScreen(<StudentModulesScreen />);
    expect(await screen.findByText('Cálculo I')).toBeTruthy();
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Semanal · Mar 14:00–16:00')).toBeTruthy();
    expect(screen.getByText('A-101 · Sede Central')).toBeTruthy();
    expect(screen.getByText('18/30 cupos')).toBeTruthy();
    expect(screen.getByText('Cupos disponibles')).toBeTruthy();
    expect(screen.getByLabelText('Inscribirme')).toBeTruthy();
  });

  it.each([
    ['LAST_SPOTS', { availableSeats: 4, state: 'LAST_SPOTS' as const }, 'Últimos cupos', 'Inscribirme'],
    ['FULL', { availableSeats: 0, state: 'FULL' as const }, 'Lleno', 'Lleno'],
    [
      'ENROLLED',
      { state: 'ENROLLED' as const, enrollment: { id: 'e1', enrolledAt: '2030-01-02T15:00:00.000Z' } },
      'Inscrito',
      'Inscrito',
    ],
  ])('draws the %s state', async (_name, overrides, badge, action) => {
    offer = () => Promise.resolve(offerPage([offerOf(overrides)]));
    await renderScreen(<StudentModulesScreen />);
    await screen.findByText('Cálculo I');
    expect(screen.getAllByText(badge).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(action)).toBeTruthy();
  });

  it('disables a full module and says why', async () => {
    offer = () => Promise.resolve(offerPage([offerOf({ availableSeats: 0, state: 'FULL' })]));
    await renderScreen(<StudentModulesScreen />);
    await screen.findByText('Cálculo I');
    expect(screen.getByLabelText('Lleno').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Sin cupos')).toBeTruthy();
  });

  it('disables a blocked module and names the conflicting module', async () => {
    offer = () =>
      Promise.resolve(
        offerPage([
          offerOf({
            state: 'BLOCKED',
            blockReason: 'SCHEDULE_CONFLICT',
            conflict: { moduleName: 'Física', dayOfWeek: 2, startTime: '14:00', endTime: '16:00' },
          }),
        ]),
      );
    await renderScreen(<StudentModulesScreen />);
    await screen.findByText('Cálculo I');
    expect(screen.getByLabelText('Inscribirme').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Se cruza con Física el martes de 14:00 a 16:00.')).toBeTruthy();
    expect(screen.getByText('Cruce de horario')).toBeTruthy();
  });

  it('explains a module whose teacher or room is unavailable', async () => {
    offer = () => Promise.resolve(offerPage([offerOf({ state: 'BLOCKED', blockReason: 'UNAVAILABLE' })]));
    await renderScreen(<StudentModulesScreen />);
    expect(await screen.findByText('El docente o el salón no están disponibles.')).toBeTruthy();
  });

  it('searches by name', async () => {
    await renderScreen(<StudentModulesScreen />);
    await screen.findByText('Cálculo I');
    await fireEvent.changeText(screen.getByLabelText('Buscar tutoría por nombre'), 'fís');
    await waitFor(() =>
      expect(mockedApi.mock.calls.map(([p]) => p as string).some((p) => p.includes('search=f%C3%ADs'))).toBe(true),
    );
  });

  it('opens the detail when the card is pressed', async () => {
    await renderScreen(<StudentModulesScreen />);
    await fireEvent.press(await screen.findByLabelText('Cálculo I'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/modules/[id]', params: { id: 'm1' } });
  });

  it('shows the empty state', async () => {
    offer = () => Promise.resolve(offerPage([]));
    await renderScreen(<StudentModulesScreen />);
    expect(await screen.findByText('Sin tutorías disponibles')).toBeTruthy();
  });

  it('shows the error and retries', async () => {
    offer = () => Promise.reject(new ApiError(500, 'INTERNAL_ERROR'));
    await renderScreen(<StudentModulesScreen />);
    expect(await screen.findByText('No pudimos cargar las tutorías')).toBeTruthy();
    offer = () => Promise.resolve(offerPage([offerOf()]));
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Cálculo I')).toBeTruthy();
  });

  it('shows the loader while the offer is loading', async () => {
    offer = () => new Promise(() => undefined);
    await renderScreen(<StudentModulesScreen />);
    expect(screen.queryByText('Cálculo I')).toBeNull();
    expect(screen.getByText('Tutorías')).toBeTruthy();
  });
});

describe('enrolling from the detail', () => {
  it('posts the module id and shows the enrolled state', async () => {
    await renderScreen(<StudentModuleDetailScreen />);
    const button = await screen.findByLabelText('Inscribirme');
    // what the API answers once the enrollment exists; the screen refetches after the POST
    detail = () =>
      Promise.resolve(
        detailOf({ state: 'ENROLLED', enrollment: { id: 'e1', enrolledAt: '2030-01-02T15:00:00.000Z' } }),
      );
    await fireEvent.press(button);
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith('/student/enrollments', { method: 'POST', body: { moduleId: 'm1' } }),
    );
    expect(await screen.findByLabelText('Inscrito')).toBeTruthy();
  });

  it('shows the rule when the schedule conflicts', async () => {
    enroll = () =>
      Promise.reject(
        new ApiError(409, 'ENROLLMENT_SCHEDULE_CONFLICT', {
          conflict: { moduleName: 'Física', dayOfWeek: 2, startTime: '14:00', endTime: '16:00' },
        }),
      );
    await renderScreen(<StudentModuleDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('Inscribirme'));
    expect(await screen.findByText('Se cruza con tu módulo Física el martes de 14:00 a 16:00.')).toBeTruthy();
  });

  it('shows the rule when the module became full', async () => {
    enroll = () => Promise.reject(new ApiError(409, 'ENROLLMENT_MODULE_FULL', { availableSeats: 0, capacity: 30 }));
    await renderScreen(<StudentModuleDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('Inscribirme'));
    expect(await screen.findByText('Este módulo no tiene lugar en alguna de sus sesiones.')).toBeTruthy();
  });

  it('lists the future sessions read only before enrolling', async () => {
    await renderScreen(<StudentModuleDetailScreen />);
    expect(await screen.findByText('Próximas sesiones')).toBeTruthy();
    expect(screen.queryByLabelText('Cancelar sesión')).toBeNull();
  });

  it('answers in English too', async () => {
    await i18n.changeLanguage('en');
    await renderScreen(<StudentModulesScreen />);
    expect(await screen.findByText('Spots available')).toBeTruthy();
    expect(screen.getByLabelText('Enroll')).toBeTruthy();
    expect(screen.getByText('18/30 spots')).toBeTruthy();
  });
});
