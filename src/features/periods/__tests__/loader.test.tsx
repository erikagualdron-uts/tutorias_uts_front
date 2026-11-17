import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { Period } from '@/api/types';
import i18n from '@/i18n';
import { PeriodsScreen } from '../screens/PeriodsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

const mockedApi = api as jest.Mock;
const period: Period = {
  id: 'p1',
  name: '2030-1',
  startsOn: '2030-01-15',
  endsOn: '2030-06-15',
  status: 'UPCOMING',
  closedAt: null,
  closedBy: null,
  hasModules: false,
};
const page = { data: [period], meta: { page: 1, limit: 100, total: 1 } };

// Lets a test decide when the server answers.
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

let client: QueryClient;
const renderScreen = () =>
  render(
    <QueryClientProvider client={client}>
      <PeriodsScreen />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
  jest.useFakeTimers();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
});
afterEach(() => jest.useRealTimers());

describe('PeriodsScreen loader', () => {
  it('shows nothing for 300 ms, then the loader, then the delay message after 1000 ms', async () => {
    mockedApi.mockReturnValue(deferred().promise);
    await renderScreen();
    await advance(299);
    expect(screen.queryByRole('progressbar')).toBeNull();
    await advance(1);
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByText(/tardando/)).toBeNull();
    await advance(700);
    expect(
      screen.getByText('Cargando… Esto está tardando más de lo normal.'),
    ).toBeTruthy();
  });

  it('removes the loader and the message together when the data arrives', async () => {
    const reply = deferred<typeof page>();
    mockedApi.mockReturnValue(reply.promise);
    await renderScreen();
    await advance(1200);
    expect(screen.getByText(/tardando/)).toBeTruthy();
    await act(async () => reply.resolve(page));
    await advance(1); // lets the query notify the screen
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(/tardando/)).toBeNull();
    expect(screen.getByText('2030-1')).toBeTruthy();
  });

  it('never shows the loader when the data arrives before 300 ms', async () => {
    mockedApi.mockResolvedValue(page);
    await renderScreen();
    await advance(50);
    expect(screen.getByText('2030-1')).toBeTruthy();
    await advance(1500);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('does not cover data that is already visible during a background refresh', async () => {
    mockedApi.mockResolvedValueOnce(page);
    await renderScreen();
    await advance(50);
    expect(screen.getByText('2030-1')).toBeTruthy();
    mockedApi.mockReturnValue(deferred().promise);
    await act(async () => {
      void client.refetchQueries();
    });
    await advance(1500);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(/tardando/)).toBeNull();
    expect(screen.getByText('2030-1')).toBeTruthy();
  });

  it('drops the delay message and shows the error state when the load fails after 1000 ms', async () => {
    const reply = deferred<typeof page>();
    mockedApi.mockReturnValue(reply.promise);
    await renderScreen();
    await advance(1200);
    expect(screen.getByText(/tardando/)).toBeTruthy();
    await act(async () => reply.reject(new ApiError(0, 'NETWORK')));
    await advance(1);
    expect(screen.queryByText(/tardando/)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('No pudimos cargar los periodos.')).toBeTruthy();
  });
});
