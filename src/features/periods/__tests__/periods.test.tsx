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
import type { Period } from '@/api/types';
import i18n from '@/i18n';
import { PeriodFormScreen } from '../screens/PeriodFormScreen';
import { PeriodsScreen } from '../screens/PeriodsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const mockParams: { id?: string } = {};
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
}));

const mockedApi = api as jest.Mock;

const period = (overrides: Partial<Period> = {}): Period => ({
  id: 'p1',
  name: '2030-1',
  startsOn: '2030-01-15',
  endsOn: '2030-06-15',
  status: 'UPCOMING',
  closedAt: null,
  closedBy: null,
  hasModules: false,
  ...overrides,
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

describe('PeriodsScreen', () => {
  it('shows the empty state', async () => {
    mockedApi.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    });
    await renderWithProviders(<PeriodsScreen />);
    expect(await screen.findByText('Aún no hay periodos')).toBeTruthy();
  });

  it('lists periods with name, dates and status', async () => {
    mockedApi.mockResolvedValue({
      data: [period({ status: 'ACTIVE' })],
      meta: { page: 1, limit: 100, total: 1 },
    });
    await renderWithProviders(<PeriodsScreen />);
    expect(await screen.findByText('2030-1')).toBeTruthy();
    expect(screen.getByText('2030-01-15 a 2030-06-15')).toBeTruthy();
    // once in the filter chip and once as the status of the card
    expect(screen.getAllByText('Activo')).toHaveLength(2);
  });

  it('shows the error state and retries', async () => {
    mockedApi.mockRejectedValueOnce(new ApiError(0, 'NETWORK'));
    mockedApi.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    });
    await renderWithProviders(<PeriodsScreen />);
    expect(
      await screen.findByText('No pudimos cargar los periodos.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Aún no hay periodos')).toBeTruthy();
  });

  it('filters by status', async () => {
    mockedApi.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    });
    await renderWithProviders(<PeriodsScreen />);
    await screen.findByText('Aún no hay periodos');
    await fireEvent.press(screen.getByLabelText('Cerrado'));
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith(
        '/academic-periods?limit=100&status=CLOSED',
      ),
    );
  });
});

describe('PeriodFormScreen', () => {
  const fill = async (name: string, startsOn: string, endsOn: string) => {
    await fireEvent.changeText(screen.getByLabelText('Nombre'), name);
    await fireEvent.changeText(
      screen.getByLabelText('Fecha de inicio (AAAA-MM-DD)'),
      startsOn,
    );
    await fireEvent.changeText(
      screen.getByLabelText('Fecha de fin (AAAA-MM-DD)'),
      endsOn,
    );
  };

  it('validates the name and the date format before sending', async () => {
    await renderWithProviders(<PeriodFormScreen />);
    await fill('', '15/01/2030', '2030-06-15');
    await fireEvent.press(screen.getByLabelText('Guardar periodo'));
    expect(await screen.findByText('Este campo es obligatorio.')).toBeTruthy();
    expect(screen.getByText('Usa el formato AAAA-MM-DD.')).toBeTruthy();
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('creates a period and goes back', async () => {
    mockedApi.mockResolvedValue(period());
    await renderWithProviders(<PeriodFormScreen />);
    await fill('2030-1', '2030-01-15', '2030-06-15');
    await fireEvent.press(screen.getByLabelText('Guardar periodo'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockedApi).toHaveBeenCalledWith('/academic-periods', {
      method: 'POST',
      body: { name: '2030-1', startsOn: '2030-01-15', endsOn: '2030-06-15' },
    });
  });

  it('shows the translated rule when the server rejects overlapping dates', async () => {
    mockedApi.mockRejectedValue(
      new ApiError(409, 'PERIOD_DATES_OVERLAP', {
        overlappingPeriod: { name: '2029-2' },
      }),
    );
    await renderWithProviders(<PeriodFormScreen />);
    await fill('2030-1', '2030-01-15', '2030-06-15');
    await fireEvent.press(screen.getByLabelText('Guardar periodo'));
    expect(
      await screen.findByText('Las fechas se solapan con el periodo 2029-2.'),
    ).toBeTruthy();
  });

  it('asks before closing the current active period, then confirms', async () => {
    mockParams.id = 'p1';
    mockedApi.mockImplementation(
      (path: string, options?: { body?: unknown }) => {
        if (path === '/academic-periods/p1/activate') {
          const confirmed = (options?.body as { confirmCloseActive: boolean })
            .confirmCloseActive;
          return confirmed
            ? Promise.resolve(period({ status: 'ACTIVE' }))
            : Promise.reject(
                new ApiError(409, 'PERIOD_ACTIVE_EXISTS', {
                  activePeriod: { name: '2029-2' },
                }),
              );
        }
        return Promise.resolve(period());
      },
    );
    await renderWithProviders(<PeriodFormScreen />);
    await fireEvent.press(await screen.findByLabelText('Activar periodo'));
    // the dialog adds a second "Activar periodo" button: the last one confirms
    await fireEvent.press(
      (await screen.findAllByLabelText('Activar periodo')).at(-1)!,
    );
    expect(
      await screen.findByText(
        'Se cerrará el periodo activo "2029-2" y quedará en solo lectura.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Activar periodo').at(-1)!);
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockedApi).toHaveBeenCalledWith('/academic-periods/p1/activate', {
      method: 'POST',
      body: { confirmCloseActive: true },
    });
  });

  it('shows a closed period as read-only and explains why it cannot be deleted', async () => {
    mockParams.id = 'p1';
    mockedApi.mockResolvedValue(period({ status: 'CLOSED' }));
    await renderWithProviders(<PeriodFormScreen />);
    expect(
      await screen.findByText(
        'Este periodo está cerrado: solo se puede consultar.',
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Guardar periodo')).toBeNull();
    expect(
      screen.getByText('Solo se puede eliminar un periodo próximo.'),
    ).toBeTruthy();
  });

  it('explains that a period with modules cannot be deleted', async () => {
    mockParams.id = 'p1';
    mockedApi.mockResolvedValue(period({ hasModules: true }));
    await renderWithProviders(<PeriodFormScreen />);
    expect(
      await screen.findByText(
        'No se puede eliminar: el periodo tiene módulos.',
      ),
    ).toBeTruthy();
  });
});
