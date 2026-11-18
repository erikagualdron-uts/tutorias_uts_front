import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { ModuleDetail } from '@/api/types';
import i18n from '@/i18n';
import { ModuleFormScreen } from '../screens/ModuleFormScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: () => mockBack() },
  useLocalSearchParams: () => ({}),
}));

const mockedApi = api as jest.Mock;
const page = (data: unknown[]) => ({ data, meta: { page: 1, limit: 100, total: data.length } });

const period = {
  id: 'p1',
  name: '2030-1',
  startsOn: '2030-01-07',
  endsOn: '2030-03-03',
  status: 'ACTIVE',
  closedAt: null,
  closedBy: null,
  hasModules: false,
};
const teacher = { id: 't1', firstName: 'Ana', lastName: 'Pérez', status: 'ACTIVE' };
const room = {
  id: 'r1',
  locationId: 'l1',
  locationName: 'Sede Central',
  name: 'A-101',
  capacity: 30,
  status: 'ACTIVE',
};

const created = (generated = 8): ModuleDetail => ({
  id: 'm1',
  periodId: 'p1',
  periodStatus: 'ACTIVE',
  name: 'Cálculo I',
  description: null,
  teacher: { id: 't1', firstName: 'Ana', lastName: 'Pérez' },
  room: { id: 'r1', name: 'A-101', locationName: 'Sede Central', capacity: 30 },
  capacity: 30,
  enrolled: 0,
  schedules: [{ id: 's1', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', sessionsGenerated: generated }],
  holidayDates: [],
  canChangeSchedules: true,
  canDelete: true,
  readOnlyReason: null,
  roomUnavailable: false,
  teacherUnavailable: false,
});

let moduleResponse: () => Promise<unknown>;

const renderWithProviders = (ui: ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  moduleResponse = () => Promise.resolve(created());
  mockedApi.mockImplementation((path: string) => {
    if (path.startsWith('/academic-periods')) return Promise.resolve(page([period]));
    if (path.startsWith('/teachers')) return Promise.resolve(page([teacher]));
    if (path.startsWith('/rooms')) return Promise.resolve(page([room]));
    if (path === '/modules') return moduleResponse();
    return Promise.reject(new Error(`unexpected ${path}`));
  });
  await i18n.changeLanguage('es');
});

const posted = () => mockedApi.mock.calls.filter(([path]) => path === '/modules');

// Fills the form as the person would: type the name, open each sheet and choose.
const fillAll = async () => {
  await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Cálculo I');
  await fireEvent.press(screen.getByLabelText('Docente'));
  await fireEvent.press(await screen.findByLabelText('Ana Pérez'));
  await fireEvent.press(screen.getByLabelText('Salón'));
  await fireEvent.press(await screen.findByLabelText('Sede Central · A-101. Capacidad: 30'));
  await fireEvent.press(screen.getByLabelText('Mar'));
  await fireEvent.press(screen.getByLabelText('Hora de inicio'));
  await fireEvent.press(await screen.findByLabelText('14:00'));
  await fireEvent.press(screen.getByLabelText('Hora de fin'));
  await fireEvent.press(await screen.findByLabelText('16:00'));
};

describe('ModuleFormScreen', () => {
  it('asks for what is missing before sending anything', async () => {
    await renderWithProviders(<ModuleFormScreen />);
    await fireEvent.press(await screen.findByLabelText('Guardar módulo'));
    // name, teacher, room and the two hours of the first slot
    expect(await screen.findAllByText('Este campo es obligatorio.')).toHaveLength(5);
    expect(posted()).toHaveLength(0);
  });

  it('creates the module with the chosen period, people, room and slot, and shows the cupo and sessions', async () => {
    await renderWithProviders(<ModuleFormScreen />);
    await screen.findByLabelText('Guardar módulo');
    await fillAll();
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));

    expect(await screen.findByText('Módulo creado')).toBeTruthy();
    expect(mockedApi).toHaveBeenCalledWith('/modules', {
      method: 'POST',
      body: {
        periodId: 'p1',
        name: 'Cálculo I',
        description: null,
        teacherId: 't1',
        roomId: 'r1',
        schedules: [{ dayOfWeek: 2, startTime: '14:00', endTime: '16:00' }],
      },
    });
    expect(screen.getByText('Cupo: 30 estudiantes')).toBeTruthy();
    expect(screen.getByText('Sesiones generadas: 8')).toBeTruthy();
    expect(screen.queryByText(/no generó sesiones/)).toBeNull();

    await fireEvent.press(screen.getByLabelText('Listo'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('warns when a slot created no sessions', async () => {
    moduleResponse = () => Promise.resolve(created(0));
    await renderWithProviders(<ModuleFormScreen />);
    await screen.findByLabelText('Guardar módulo');
    await fillAll();
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    expect(await screen.findByText(/no generó sesiones/)).toBeTruthy();
  });

  it('names the module and the hours of a teacher conflict and keeps what was typed', async () => {
    moduleResponse = () =>
      Promise.reject(
        new ApiError(409, 'MODULE_TEACHER_CONFLICT', {
          conflict: { moduleName: 'Álgebra', dayOfWeek: 2, startTime: '14:00', endTime: '16:00' },
        }),
      );
    await renderWithProviders(<ModuleFormScreen />);
    await screen.findByLabelText('Guardar módulo');
    await fillAll();
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    expect(
      await screen.findByText('El docente ya tiene el módulo Álgebra el martes de 14:00 a 16:00.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Nombre').props.value).toBe('Cálculo I');
  });

  it('explains a closed period and keeps what was typed', async () => {
    moduleResponse = () => Promise.reject(new ApiError(409, 'PERIOD_CLOSED_READ_ONLY'));
    await renderWithProviders(<ModuleFormScreen />);
    await screen.findByLabelText('Guardar módulo');
    await fillAll();
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    expect(await screen.findByText('Un periodo cerrado es de solo lectura.')).toBeTruthy();
    expect(screen.getByLabelText('Nombre').props.value).toBe('Cálculo I');
  });

  it('shows the loader on the button while the module is being saved', async () => {
    let finish: (value: unknown) => void = () => {};
    moduleResponse = () => new Promise((resolve) => (finish = resolve));
    await renderWithProviders(<ModuleFormScreen />);
    await screen.findByLabelText('Guardar módulo');
    await fillAll();
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    await waitFor(() => expect(posted()).toHaveLength(1));
    // a second press while saving does not send a second request
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    expect(posted()).toHaveLength(1);
    finish(created());
    expect(await screen.findByText('Módulo creado')).toBeTruthy();
  });

  it('adds and removes weekly slots and flags two that overlap', async () => {
    await renderWithProviders(<ModuleFormScreen />);
    await screen.findByLabelText('Guardar módulo');
    expect(screen.queryByLabelText('Quitar horario 1')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Agregar horario'));
    expect(screen.getByLabelText('Quitar horario 2')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Quitar horario 2'));
    expect(screen.queryByLabelText('Quitar horario 2')).toBeNull();

    // two Monday slots, 14:00-16:00 and 15:00-17:00
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Cálculo I');
    await fireEvent.press(screen.getByLabelText('Docente'));
    await fireEvent.press(await screen.findByLabelText('Ana Pérez'));
    await fireEvent.press(screen.getByLabelText('Salón'));
    await fireEvent.press(await screen.findByLabelText('Sede Central · A-101. Capacidad: 30'));
    await fireEvent.press(screen.getByLabelText('Agregar horario'));
    const times = [
      ['14:00', '16:00'],
      ['15:00', '17:00'],
    ];
    for (const [i, [start, end]] of times.entries()) {
      await fireEvent.press(screen.getAllByLabelText('Hora de inicio')[i]!);
      await fireEvent.press(await screen.findByLabelText(start!));
      await fireEvent.press(screen.getAllByLabelText('Hora de fin')[i]!);
      await fireEvent.press(await screen.findByLabelText(end!));
    }
    await fireEvent.press(screen.getByLabelText('Guardar módulo'));
    expect(await screen.findByText('Dos horarios del módulo se solapan.')).toBeTruthy();
    expect(posted()).toHaveLength(0);
  });

  it('offers only periods that are not closed', async () => {
    mockedApi.mockImplementation((path: string) =>
      path.startsWith('/academic-periods')
        ? Promise.resolve(page([period, { ...period, id: 'p0', name: '2029-2', status: 'CLOSED' }]))
        : Promise.resolve(page([])),
    );
    await renderWithProviders(<ModuleFormScreen />);
    await fireEvent.press(await screen.findByLabelText('Periodo'));
    expect(await screen.findByLabelText('2030-1. Activo')).toBeTruthy();
    expect(screen.queryByLabelText('2029-2. Cerrado')).toBeNull();
  });
});
