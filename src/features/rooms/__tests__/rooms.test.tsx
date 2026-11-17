import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { Location, Room } from '@/api/types';
import i18n from '@/i18n';
import { LocationFormScreen } from '../screens/LocationFormScreen';
import { RoomFormScreen } from '../screens/RoomFormScreen';
import { RoomsScreen } from '../screens/RoomsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const mockParams: { id?: string } = {};
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
}));

const mockedApi = api as jest.Mock;

const location = (overrides: Partial<Location> = {}): Location => ({
  id: 'l1',
  name: 'Sede Central',
  roomCounts: { active: 0, inactive: 0 },
  ...overrides,
});
const room = (overrides: Partial<Room> = {}): Room => ({
  id: 'r1',
  locationId: 'l1',
  locationName: 'Sede Central',
  name: 'A-101',
  capacity: 30,
  status: 'ACTIVE',
  ...overrides,
});
const page = <T,>(data: T[]) => ({
  data,
  meta: { page: 1, limit: 100, total: data.length },
});

// Routes the mocked API by path so each test only states what differs.
const serve = (handlers: Record<string, unknown>) =>
  mockedApi.mockImplementation((path: string) => {
    const key = Object.keys(handlers).find((k) => path.startsWith(k));
    const value = key ? handlers[key] : undefined;
    return value instanceof Error
      ? Promise.reject(value)
      : Promise.resolve(value);
  });

const renderWithProviders = (ui: ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams.id = undefined;
  await i18n.changeLanguage('es');
});

describe('RoomsScreen', () => {
  it('shows the empty state', async () => {
    serve({ '/locations': page([]), '/rooms': page([]) });
    await renderWithProviders(<RoomsScreen />);
    expect(await screen.findByText('Aún no hay salones')).toBeTruthy();
  });

  it('lists rooms with location, capacity and status', async () => {
    serve({ '/locations': page([location()]), '/rooms': page([room()]) });
    await renderWithProviders(<RoomsScreen />);
    expect(await screen.findByText('A-101')).toBeTruthy();
    expect(screen.getByText('Sede Central · Capacidad: 30')).toBeTruthy();
  });

  it('shows the error state', async () => {
    serve({
      '/locations': page([]),
      '/rooms': new ApiError(0, 'NETWORK'),
    });
    await renderWithProviders(<RoomsScreen />);
    expect(
      await screen.findByText('No pudimos cargar los salones.'),
    ).toBeTruthy();
  });

  it('sends the search text and the status filter to the server', async () => {
    serve({ '/locations': page([location()]), '/rooms': page([]) });
    await renderWithProviders(<RoomsScreen />);
    await screen.findByText('Aún no hay salones');
    await fireEvent.changeText(
      screen.getByLabelText('Buscar salón por nombre'),
      'lab',
    );
    await fireEvent.press(screen.getByLabelText('Inactivo'));
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith(
        '/rooms?limit=100&search=lab&status=INACTIVE',
      ),
    );
    expect(await screen.findByText('Sin resultados')).toBeTruthy();
  });
});

describe('RoomFormScreen', () => {
  const fill = async (name: string, capacity: string) => {
    await fireEvent.changeText(screen.getByLabelText('Nombre o código'), name);
    await fireEvent.changeText(screen.getByLabelText('Capacidad'), capacity);
  };

  it('requires a location, a name and a positive whole capacity', async () => {
    serve({ '/locations': page([location()]) });
    await renderWithProviders(<RoomFormScreen />);
    await fill('', '0');
    await fireEvent.press(screen.getByLabelText('Guardar salón'));
    expect(
      await screen.findAllByText('Este campo es obligatorio.'),
    ).toHaveLength(2);
    expect(
      screen.getByText('Escribe un número entero mayor que cero.'),
    ).toBeTruthy();
    expect(mockedApi).not.toHaveBeenCalledWith('/rooms', expect.anything());
  });

  it('creates a room choosing its location', async () => {
    serve({ '/locations': page([location()]), '/rooms': room() });
    await renderWithProviders(<RoomFormScreen />);
    await fireEvent.press(screen.getByLabelText('Ubicación'));
    await fireEvent.press(await screen.findByLabelText('Sede Central'));
    await fill('A-101', '30');
    await fireEvent.press(screen.getByLabelText('Guardar salón'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockedApi).toHaveBeenCalledWith('/rooms', {
      method: 'POST',
      body: { locationId: 'l1', name: 'A-101', capacity: 30 },
    });
  });

  it('warns about upcoming modules before deactivating', async () => {
    mockParams.id = 'r1';
    serve({
      '/locations': page([location()]),
      '/rooms/r1/impact': {
        modulesInActivePeriod: 0,
        modulesInUpcomingPeriods: 3,
        maxEnrolled: 0,
      },
      '/rooms/r1/deactivate': room({ status: 'INACTIVE' }),
      '/rooms/r1': room(),
    });
    await renderWithProviders(<RoomFormScreen />);
    await fireEvent.press(await screen.findByLabelText('Desactivar salón'));
    expect(
      await screen.findByText(/Tiene 3 módulos en periodos próximos/),
    ).toBeTruthy();
    await fireEvent.press(
      (await screen.findAllByLabelText('Desactivar salón')).at(-1)!,
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('shows the rule when the server blocks the deactivation', async () => {
    mockParams.id = 'r1';
    serve({
      '/locations': page([location()]),
      '/rooms/r1/impact': {
        modulesInActivePeriod: 1,
        modulesInUpcomingPeriods: 0,
        maxEnrolled: 0,
      },
      '/rooms/r1/deactivate': new ApiError(409, 'ROOM_IN_ACTIVE_PERIOD'),
      '/rooms/r1': room(),
    });
    await renderWithProviders(<RoomFormScreen />);
    await fireEvent.press(await screen.findByLabelText('Desactivar salón'));
    await fireEvent.press(
      (await screen.findAllByLabelText('Desactivar salón')).at(-1)!,
    );
    expect(
      await screen.findByText(
        'El salón tiene módulos en el periodo activo, así que no se puede desactivar ni eliminar.',
      ),
    ).toBeTruthy();
  });
});

describe('LocationFormScreen', () => {
  it('blocks deleting a location with active rooms and says why', async () => {
    mockParams.id = 'l1';
    serve({
      '/locations/l1': location({ roomCounts: { active: 2, inactive: 0 } }),
    });
    await renderWithProviders(<LocationFormScreen />);
    expect(
      await screen.findByText(
        'No se puede eliminar: tiene salones activos. Desactiva o elimina antes sus salones.',
      ),
    ).toBeTruthy();
  });

  it('tells how many inactive rooms will be deleted with the location', async () => {
    mockParams.id = 'l1';
    serve({
      '/locations/l1': location({ roomCounts: { active: 0, inactive: 4 } }),
    });
    await renderWithProviders(<LocationFormScreen />);
    await fireEvent.press(await screen.findByLabelText('Eliminar ubicación'));
    expect(
      await screen.findByText(/Se eliminarán también sus 4 salones inactivos/),
    ).toBeTruthy();
  });
});
