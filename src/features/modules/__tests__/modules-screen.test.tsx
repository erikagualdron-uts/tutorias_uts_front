import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { ModulesScreen } from '../screens/ModulesScreen';
import { moduleOf, page, periodOf } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn() } }));

const mockedApi = api as jest.Mock;
const closed = periodOf({ id: 'p0', name: '2029-2', status: 'CLOSED' });
let modules: (path: string) => Promise<unknown>;

const renderScreen = (ui: ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  modules = () => Promise.resolve(page([moduleOf()], { periodId: 'p1' }));
  mockedApi.mockImplementation((path: string) => {
    if (path.startsWith('/modules')) return modules(path);
    if (path.startsWith('/academic-periods')) return Promise.resolve(page([periodOf(), closed]));
    return Promise.resolve(page([]));
  });
  await i18n.changeLanguage('es');
});

const modulesCalls = () => mockedApi.mock.calls.map(([path]) => path as string).filter((p) => p.startsWith('/modules'));

describe('ModulesScreen', () => {
  it('lists the modules of the period with teacher, room, schedule and cupo', async () => {
    await renderScreen(<ModulesScreen />);
    expect(await screen.findByText('Cálculo I')).toBeTruthy();
    expect(screen.getByText('Ana Pérez · Sede Central A-101')).toBeTruthy();
    expect(screen.getByText('Mar 14:00–16:00')).toBeTruthy();
    expect(screen.getByText('Cupo: 7 / 25')).toBeTruthy();
    expect(await screen.findByText('2030-1 · Activo')).toBeTruthy();
  });

  it('opens with the brand header and the count', async () => {
    await renderScreen(<ModulesScreen />);
    expect(await screen.findByRole('header', { name: i18n.t('modules.title') })).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('opens the detail of a module', async () => {
    await renderScreen(<ModulesScreen />);
    await fireEvent.press(await screen.findByLabelText('Cálculo I'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/modules/[id]', params: { id: 'm1' } });
  });

  it('marks a teacher or a room that is no longer available', async () => {
    modules = () =>
      Promise.resolve(page([moduleOf({ teacherUnavailable: true, roomUnavailable: true })], { periodId: 'p1' }));
    await renderScreen(<ModulesScreen />);
    expect(await screen.findByText('Docente no disponible')).toBeTruthy();
    expect(screen.getByText('Salón no disponible')).toBeTruthy();
  });

  it('shows the empty state with the way to create a module', async () => {
    modules = () => Promise.resolve(page([], { periodId: 'p1' }));
    await renderScreen(<ModulesScreen />);
    expect(await screen.findByText('Aún no hay módulos')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Nuevo módulo'));
    expect(mockPush).toHaveBeenCalledWith('/modules/module-form');
  });

  it('shows the error state and retries', async () => {
    modules = () => Promise.reject(new ApiError(500, 'INTERNAL_ERROR'));
    await renderScreen(<ModulesScreen />);
    expect(await screen.findByText('No pudimos cargar los módulos')).toBeTruthy();
    modules = () => Promise.resolve(page([moduleOf()], { periodId: 'p1' }));
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Cálculo I')).toBeTruthy();
  });

  it('searches by name and says so when nothing matches', async () => {
    await renderScreen(<ModulesScreen />);
    await screen.findByText('Cálculo I');
    modules = () => Promise.resolve(page([], { periodId: 'p1' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar módulo'), 'zzz');
    expect(await screen.findByText('Sin resultados')).toBeTruthy();
    expect(modulesCalls().some((p) => p.includes('search=zzz'))).toBe(true);
  });

  it('changes the period and hides the create button when it is closed', async () => {
    await renderScreen(<ModulesScreen />);
    await screen.findByText('Cálculo I');
    await fireEvent.press(screen.getByLabelText('Periodo'));
    await fireEvent.press(await screen.findByLabelText('2029-2. Cerrado'));
    await waitFor(() => expect(modulesCalls().some((p) => p.includes('periodId=p0'))).toBe(true));
    await waitFor(() => expect(screen.queryByLabelText('Nuevo módulo')).toBeNull());
    expect(screen.getByLabelText('Salones y ubicaciones')).toBeTruthy();
  });
});
