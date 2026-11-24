import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { Holiday } from '@/api/types';
import { dayToDate, todayInBogota } from '@/date/day';
import i18n from '@/i18n';
import { HolidayFormScreen } from '../screens/HolidayFormScreen';
import { HolidaysImportScreen } from '../screens/HolidaysImportScreen';
import { HolidaysScreen } from '../screens/HolidaysScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockParams: { id?: string; year?: string } = {};
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: (...a: unknown[]) => mockReplace(...a), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
}));

const mockedApi = api as jest.Mock;
const picker = jest.requireMock('@react-native-community/datetimepicker') as { default: { lastProps?: Record<string, any> } };
const thisYear = Number(todayInBogota().slice(0, 4));

const holiday = (overrides: Partial<Holiday> = {}): Holiday => ({
  id: 'h1',
  date: '2030-01-22',
  name: 'Festivo de prueba',
  source: 'MANUAL',
  isPast: false,
  ...overrides,
});
let respond: (path: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

const renderScreen = (ui: ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams.id = undefined;
  mockParams.year = undefined;
  respond = () => Promise.resolve({ data: [] });
  mockedApi.mockImplementation((path: string, options?: object) => respond(path, options));
  await i18n.changeLanguage('es');
});

const writes = () => mockedApi.mock.calls.filter(([, o]) => o?.method).map(([p, o]) => [o.method, p, o.body]);

describe('HolidaysScreen', () => {
  it('opens with the brand header and the count', async () => {
    await renderScreen(<HolidaysScreen />);
    expect(await screen.findByRole('header', { name: i18n.t('holidays.title') })).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('shows the empty state, and the way to add or import', async () => {
    await renderScreen(<HolidaysScreen />);
    expect(await screen.findByText('Sin festivos')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Agregar festivo'));
    await fireEvent.press(screen.getByLabelText('Importar festivos'));
    expect(mockPush).toHaveBeenCalledWith('/more/holiday-form');
    expect(mockPush).toHaveBeenCalledWith('/more/holidays-import');
  });

  it('lists holidays with date, source and the mark of the ones that passed', async () => {
    respond = () =>
      Promise.resolve({
        data: [holiday({ isPast: true, id: 'h0', name: 'Viejo', date: '2026-01-01' }), holiday({ source: 'IMPORTED' })],
      });
    await renderScreen(<HolidaysScreen />);
    expect(await screen.findByText('22/01/2030 · Importado')).toBeTruthy();
    expect(screen.getByText('Ya pasó')).toBeTruthy();
    expect(screen.getByLabelText('01/01/2026 Viejo').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByLabelText('22/01/2030 Festivo de prueba'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/more/holiday-form', params: { id: 'h1', year: '2030' } });
  });

  it('changes the year and asks for that one', async () => {
    await renderScreen(<HolidaysScreen />);
    await screen.findByText('Sin festivos');
    await fireEvent.press(screen.getByLabelText(String(thisYear + 1)));
    await waitFor(() => expect(mockedApi).toHaveBeenCalledWith(`/holidays?year=${thisYear + 1}`));
  });

  it('shows the error and retries', async () => {
    respond = () => Promise.reject(new ApiError(500, 'INTERNAL_ERROR'));
    await renderScreen(<HolidaysScreen />);
    expect(await screen.findByText('No pudimos cargar los festivos')).toBeTruthy();
    respond = () => Promise.resolve({ data: [holiday()] });
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Festivo de prueba')).toBeTruthy();
  });
});

describe('HolidayFormScreen', () => {
  const pickDate = async (day: string) => {
    await fireEvent.press(screen.getByLabelText('Fecha'));
    await act(async () => {
      picker.default.lastProps?.onValueChange({}, dayToDate(day));
    });
    await fireEvent.press(screen.getByLabelText('Confirmar'));
  };

  it('does not let the date be typed by hand and asks for both fields', async () => {
    await renderScreen(<HolidayFormScreen />);
    expect((JSON.stringify(screen.toJSON()).match(/"type":"TextInput"/g) ?? []).length).toBe(1);
    await fireEvent.press(screen.getByLabelText('Guardar festivo'));
    expect(await screen.findAllByText('Este campo es obligatorio.')).toHaveLength(2);
    expect(writes()).toHaveLength(0);
  });

  it('creates a holiday and goes back when no session was cancelled', async () => {
    respond = () => Promise.resolve({ holiday: holiday(), cancelledSessions: 0 });
    await renderScreen(<HolidayFormScreen />);
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Festivo de prueba');
    await pickDate('2030-01-22');
    await fireEvent.press(screen.getByLabelText('Guardar festivo'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(writes()).toEqual([['POST', '/holidays', { name: 'Festivo de prueba', date: '2030-01-22' }]]);
  });

  it('says how many sessions the holiday cancelled', async () => {
    respond = () => Promise.resolve({ holiday: holiday(), cancelledSessions: 3 });
    await renderScreen(<HolidayFormScreen />);
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Festivo de prueba');
    await pickDate('2030-01-22');
    await fireEvent.press(screen.getByLabelText('Guardar festivo'));
    expect(await screen.findByText('Sesiones canceladas por el festivo: 3')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('shows the rule when the date is taken', async () => {
    respond = () => Promise.reject(new ApiError(409, 'HOLIDAY_DATE_TAKEN'));
    await renderScreen(<HolidayFormScreen />);
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Otro');
    await pickDate('2030-01-22');
    await fireEvent.press(screen.getByLabelText('Guardar festivo'));
    expect(await screen.findByText('Ya hay un festivo registrado en esa fecha.')).toBeTruthy();
  });

  it('edits a saved holiday and deletes it after a confirmation, reporting the sessions given back', async () => {
    mockParams.id = 'h1';
    mockParams.year = '2030';
    respond = (path, options) =>
      Promise.resolve(options?.method === 'DELETE' ? { restored: 2, generated: 1, notRestored: [{ sessionId: 's', moduleId: 'm', reason: 'ROOM_BUSY' }] } : { data: [holiday()] });
    await renderScreen(<HolidayFormScreen />);
    await waitFor(() => expect(screen.getByLabelText('Nombre').props.value).toBe('Festivo de prueba'));
    expect(mockedApi).toHaveBeenCalledWith('/holidays?year=2030');
    await fireEvent.press(screen.getByLabelText('Eliminar festivo'));
    expect(screen.getByText(/se oculta, no se borra/)).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Eliminar festivo').at(-1)!);
    expect(await screen.findByText('Sesiones restauradas: 2')).toBeTruthy();
    expect(screen.getByText('Sesiones generadas que faltaban: 1')).toBeTruthy();
    expect(screen.getByText(/no se pudieron restaurar.*: 1/)).toBeTruthy();
    expect(writes()).toEqual([['DELETE', '/holidays/h1', undefined]]);
  });
});

describe('HolidaysImportScreen', () => {
  const preview = [
    { date: `${thisYear + 1}-01-01`, name: 'Año Nuevo', alreadyExists: true, isPast: false },
    { date: `${thisYear + 1}-03-25`, name: 'San José', alreadyExists: false, isPast: false },
    { date: `${thisYear + 1}-07-20`, name: 'Independencia', alreadyExists: false, isPast: false },
    { date: `${thisYear + 1}-08-07`, name: 'Boyacá', alreadyExists: false, isPast: true },
  ];

  it('previews the list, blocks what exists or has passed, and imports only the chosen dates', async () => {
    respond = (path, options) =>
      Promise.resolve(options?.method === 'POST' ? { created: 2, skipped: 0, cancelledSessions: 4 } : { data: preview });
    await renderScreen(<HolidaysImportScreen />);
    expect(await screen.findByText(/Ya registrado/)).toBeTruthy();
    expect(screen.getByText(/Ya pasó/)).toBeTruthy();
    expect(screen.getByLabelText(/Año Nuevo/).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText(/Boyacá/).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText('Importar (0)').props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(screen.getByLabelText(/San José/));
    await fireEvent.press(screen.getByLabelText(/Independencia/));
    await fireEvent.press(screen.getByLabelText('Importar (2)'));
    expect(await screen.findByText('Festivos importados: 2')).toBeTruthy();
    expect(screen.getByText('Sesiones canceladas por el festivo: 4')).toBeTruthy();
    expect(writes()).toEqual([['POST', '/holidays/import', { year: thisYear + 1, dates: [`${thisYear + 1}-03-25`, `${thisYear + 1}-07-20`] }]]);
  });

  it('lets the person unselect a date again', async () => {
    respond = () => Promise.resolve({ data: preview });
    await renderScreen(<HolidaysImportScreen />);
    await fireEvent.press(await screen.findByLabelText(/San José/));
    expect(screen.getByLabelText('Importar (1)')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/San José/));
    expect(screen.getByLabelText('Importar (0)')).toBeTruthy();
  });

  it('explains that the service is unavailable and offers the manual calendar', async () => {
    respond = () => Promise.reject(new ApiError(502, 'HOLIDAYS_IMPORT_UNAVAILABLE'));
    await renderScreen(<HolidaysImportScreen />);
    expect(await screen.findByText(/No pudimos obtener los festivos/)).toBeTruthy();
    expect(screen.queryByLabelText(/Importar \(/)).toBeNull();
    await fireEvent.press(screen.getByLabelText('Registrar a mano'));
    expect(mockReplace).toHaveBeenCalledWith('/more/holiday-form');
    expect(writes()).toHaveLength(0);
  });

  it('changes the year and clears the selection', async () => {
    respond = () => Promise.resolve({ data: preview });
    await renderScreen(<HolidaysImportScreen />);
    await fireEvent.press(await screen.findByLabelText(/San José/));
    await fireEvent.press(screen.getByLabelText(String(thisYear + 2)));
    await waitFor(() => expect(mockedApi).toHaveBeenCalledWith(`/holidays/import-preview?year=${thisYear + 2}`));
    expect(await screen.findByLabelText('Importar (0)')).toBeTruthy();
  });
});
