import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { ModuleDetail } from '@/api/types';
import i18n from '@/i18n';
import { ModuleDetailScreen } from '../screens/ModuleDetailScreen';
import { ModuleFormScreen } from '../screens/ModuleFormScreen';
import { detailOf, page } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: () => mockBack() },
  useLocalSearchParams: () => ({ id: 'm1' }),
}));

const mockedApi = api as jest.Mock;
let detail: ModuleDetail;
let write: (path: string, options: { method: string }) => Promise<unknown>;

const renderScreen = (ui: ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  detail = detailOf({ canChangeSchedules: true, canDelete: true, enrolled: 0 });
  write = () => Promise.resolve(detail);
  mockedApi.mockImplementation((path: string, options?: { method?: string }) => {
    if (options?.method) return write(path, options as { method: string });
    if (path.startsWith('/academic-periods')) return Promise.resolve(page([{ id: 'p1', name: '2030-1', status: 'ACTIVE' }]));
    if (path.endsWith('/sessions?limit=100')) return Promise.resolve(page([]));
    if (path === '/modules/m1') return Promise.resolve(detail);
    return Promise.resolve(page([]));
  });
  await i18n.changeLanguage('es');
});

const writes = () => mockedApi.mock.calls.filter(([, options]) => options?.method).map(([p, o]) => [o.method, p, o.body]);

describe('edit module', () => {
  it('starts from the saved data and locks period, teacher and room', async () => {
    await renderScreen(<ModuleFormScreen />);
    await waitFor(() => expect(screen.getByLabelText('Nombre').props.value).toBe('Cálculo I'));
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Sede Central · A-101')).toBeTruthy();
    for (const label of ['Periodo', 'Docente', 'Salón']) {
      expect(screen.getByLabelText(label).props.accessibilityState.disabled).toBe(true);
    }
  });

  it('saves only the name and description when the schedules did not change', async () => {
    await renderScreen(<ModuleFormScreen />);
    await waitFor(() => expect(screen.getByLabelText('Nombre').props.value).toBe('Cálculo I'));
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Cálculo II');
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(writes()).toEqual([['PATCH', '/modules/m1', { name: 'Cálculo II', description: 'Refuerzo de límites' }]]);
  });

  it('replaces the schedules first when they changed', async () => {
    await renderScreen(<ModuleFormScreen />);
    await waitFor(() => expect(screen.getByLabelText('Nombre').props.value).toBe('Cálculo I'));
    await fireEvent.press(screen.getByLabelText('Jue'));
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(writes().map(([method, path]) => `${method} ${path}`)).toEqual(['PUT /modules/m1/schedules', 'PATCH /modules/m1']);
    expect(writes()[0]![2]).toEqual({ schedules: [{ dayOfWeek: 4, startTime: '14:00', endTime: '16:00' }] });
  });

  it('locks the schedules with the rule while there are enrolled students, but still saves the name', async () => {
    detail = detailOf({ canChangeSchedules: false, canDelete: false, enrolled: 5 });
    await renderScreen(<ModuleFormScreen />);
    expect(await screen.findByText(/tiene 5 inscritos/)).toBeTruthy();
    expect(screen.queryByLabelText('Agregar horario')).toBeNull();
    await waitFor(() => expect(screen.getByLabelText('Nombre').props.value).toBe('Cálculo I'));
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(writes().map(([method]) => method)).toEqual(['PATCH']);
  });

  it('shows the rule when the server refuses and stays on the form', async () => {
    write = () => Promise.reject(new ApiError(409, 'PERIOD_CLOSED_READ_ONLY'));
    await renderScreen(<ModuleFormScreen />);
    await waitFor(() => expect(screen.getByLabelText('Nombre').props.value).toBe('Cálculo I'));
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    expect(await screen.findByText('Un periodo cerrado es de solo lectura.')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});

describe('detail actions', () => {
  it('opens the edit form', async () => {
    await renderScreen(<ModuleDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('Editar'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/modules/module-form', params: { id: 'm1' } });
  });

  it('deletes after a destructive confirmation that says the record is hidden', async () => {
    await renderScreen(<ModuleDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('Eliminar'));
    expect(screen.getByText(/se oculta, no se borra/)).toBeTruthy();
    expect(writes()).toHaveLength(0);
    await fireEvent.press(screen.getByLabelText('Eliminar módulo'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(writes()).toEqual([['DELETE', '/modules/m1', undefined]]);
  });

  it('blocks deletion with enrolled students and explains the rule', async () => {
    detail = detailOf({ canDelete: false, enrolled: 3 });
    await renderScreen(<ModuleDetailScreen />);
    const button = await screen.findByLabelText('Eliminar');
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText(/tiene estudiantes inscritos \(3\)/)).toBeTruthy();
  });
});
