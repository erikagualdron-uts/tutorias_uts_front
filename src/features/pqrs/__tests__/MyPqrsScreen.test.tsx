import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { MyPqrsScreen } from '../screens/MyPqrsScreen';
import { PqrsDetailScreen } from '../screens/PqrsDetailScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'p1' }),
}));

const mockedApi = api as jest.Mock;
const type = { id: 't1', labelEs: 'Petición', labelEn: 'Request' };
const pqrs = (n: number, overrides: object = {}) => ({
  id: `p${n}`,
  type,
  subject: `Asunto ${n}`,
  status: 'FILED',
  createdAt: '2030-01-08T19:00:00.000Z',
  updatedAt: '2030-01-08T19:00:00.000Z',
  ...overrides,
});
const page = (data: unknown[]) => ({ data, meta: { page: 1, limit: 20, total: data.length } });
const renderScreen = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const paths = () => mockedApi.mock.calls.map(([path]) => path as string);

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('MyPqrsScreen', () => {
  it('shows each PQRS with its subject, type, date and the state as text', async () => {
    mockedApi.mockResolvedValue(page([pqrs(1), pqrs(2, { status: 'IN_REVIEW' }), pqrs(3, { status: 'RESOLVED' })]));
    await renderScreen(<MyPqrsScreen />);
    expect(await screen.findByText('Asunto 1')).toBeTruthy();
    expect(screen.getAllByText(/Petición · Radicada el/)).toHaveLength(3);
    // the filing number of each PQRS (the code of its id), the same one the confirmation showed
    for (const code of ['P1', 'P2', 'P3']) expect(screen.getByText(`N.º ${code}`)).toBeTruthy();
    expect(screen.getAllByText('Radicada').length).toBeGreaterThan(0);
    expect(screen.getAllByText('En revisión').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resuelta').length).toBeGreaterThan(0);
  });

  it('shows the loading, empty and error-with-retry states', async () => {
    mockedApi.mockReturnValue(new Promise(() => undefined));
    const loading = await renderScreen(<MyPqrsScreen />);
    expect(screen.queryByText('Aún no has radicado ninguna PQRS')).toBeNull();
    await loading.unmount();

    mockedApi.mockResolvedValue(page([]));
    const empty = await renderScreen(<MyPqrsScreen />);
    expect(await screen.findByText('Aún no has radicado ninguna PQRS')).toBeTruthy();
    await empty.unmount();

    mockedApi.mockRejectedValueOnce(new ApiError(500, 'INTERNAL_ERROR')).mockResolvedValue(page([pqrs(1)]));
    await renderScreen(<MyPqrsScreen />);
    expect(await screen.findByText('No pudimos cargar tus PQRS')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Asunto 1')).toBeTruthy();
  });

  it('sends the state filter to the server and explains an empty filtered list', async () => {
    mockedApi.mockResolvedValue(page([pqrs(1)]));
    await renderScreen(<MyPqrsScreen />);
    await screen.findByText('Asunto 1');
    mockedApi.mockResolvedValue(page([]));
    await fireEvent.press(screen.getByLabelText('Resuelta'));
    await waitFor(() => expect(paths()).toContain('/pqrs/mine?page=1&limit=20&status=RESOLVED'));
    expect(await screen.findByText('No hay PQRS con ese estado')).toBeTruthy();
  });

  it('opens the form to file a new PQRS and the detail of one', async () => {
    mockedApi.mockResolvedValue(page([pqrs(1)]));
    await renderScreen(<MyPqrsScreen />);
    await fireEvent.press(await screen.findByLabelText('Nueva PQRS'));
    expect(mockPush).toHaveBeenCalledWith('/(student)/pqrs/new');
    await fireEvent.press(await screen.findByLabelText('Asunto 1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(student)/pqrs/[id]', params: { id: 'p1' } });
  });
});

describe('PqrsDetailScreen', () => {
  const detail = (overrides: object = {}) => ({
    ...pqrs(1, { status: 'IN_REVIEW' }),
    description: 'No encuentro el horario',
    reviewedAt: '2030-01-09T15:00:00.000Z',
    resolvedAt: null,
    messages: [
      { id: 'm1', body: 'Primera respuesta', createdAt: '2030-01-09T15:00:00.000Z' },
      { id: 'm2', body: 'Segunda respuesta', createdAt: '2030-01-10T15:00:00.000Z' },
    ],
    ...overrides,
  });

  it('shows the state, what I wrote and the replies in order', async () => {
    mockedApi.mockResolvedValue(detail());
    await renderScreen(<PqrsDetailScreen />);
    expect(await screen.findByText('Asunto 1')).toBeTruthy();
    // the badge and the current step of the timeline both say it
    expect(screen.getAllByText('En revisión')).toHaveLength(2);
    expect(screen.getByText('No encuentro el horario')).toBeTruthy();
    expect(screen.getByText('N.º P1')).toBeTruthy();
    // the timeline: filing and review with their dates, resolution still pending
    expect(screen.getByLabelText('En revisión, actual, 09/01/2030 · 10:00')).toBeTruthy();
    expect(screen.getByLabelText('Resuelta, pendiente')).toBeTruthy();
    const replies = screen.getAllByText(/respuesta$/).map((node) => node.props.children);
    expect(replies).toEqual(['Primera respuesta', 'Segunda respuesta']);
    expect(paths()).toContain('/pqrs/mine/p1');
  });

  it('tells the author that there are no replies yet', async () => {
    mockedApi.mockResolvedValue(detail({ status: 'FILED', messages: [] }));
    await renderScreen(<PqrsDetailScreen />);
    expect(await screen.findByText(/Aún no hay respuestas/)).toBeTruthy();
  });

  it('shows an error with retry when the PQRS does not load', async () => {
    mockedApi.mockRejectedValueOnce(new ApiError(404, 'PQRS_NOT_FOUND')).mockResolvedValue(detail());
    await renderScreen(<PqrsDetailScreen />);
    expect(await screen.findByText('No pudimos cargar la PQRS')).toBeTruthy();
    expect(screen.getByText('No encontramos esa PQRS.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Asunto 1')).toBeTruthy();
  });
});
