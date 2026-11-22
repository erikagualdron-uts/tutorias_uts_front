import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { AdminPqrsDetailScreen } from '../screens/AdminPqrsDetailScreen';
import { AdminPqrsScreen } from '../screens/AdminPqrsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'p1' }),
}));

const mockedApi = api as jest.Mock;
const LIMITS = { subjectMaxLength: 120, descriptionMaxLength: 2000, responseMaxLength: 2000 };
const type = { id: 't1', labelEs: 'Petición', labelEn: 'Request' };
const author = { id: 'u1', role: 'STUDENT', firstName: 'Ana', lastName: 'Soto', email: 'ana@uts.edu.co' };
const summary = (n: number, overrides: object = {}) => ({
  id: `p${n}`,
  type,
  subject: `Asunto ${n}`,
  status: 'FILED',
  createdAt: '2030-01-08T19:00:00.000Z',
  updatedAt: '2030-01-08T19:00:00.000Z',
  author,
  ...overrides,
});
const detail = (overrides: object = {}) => ({
  ...summary(1),
  description: 'No encuentro el horario',
  reviewedAt: null,
  resolvedAt: null,
  messages: [],
  ...overrides,
});
const page = (data: unknown[]) => ({ data, meta: { page: 1, limit: 20, total: data.length } });
const routes = (handlers: Record<string, unknown>) =>
  mockedApi.mockImplementation((path: string, options?: { method?: string }) => {
    const key = `${options?.method ?? 'GET'} ${path}`;
    const hit = Object.entries(handlers).find(([pattern]) => key.startsWith(pattern));
    return hit ? Promise.resolve(hit[1]) : Promise.reject(new Error(key));
  });
const renderScreen = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const paths = () => mockedApi.mock.calls.map(([path]) => path as string);
const calls = (path: string) => mockedApi.mock.calls.filter(([p, o]) => p === path && o?.method === 'POST');

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('AdminPqrsScreen', () => {
  const list = { 'GET /pqrs?': page([summary(1), summary(2, { status: 'RESOLVED' })]), 'GET /dropdown-lists/PQRS_TYPE': { key: 'PQRS_TYPE', items: [{ ...type, sortOrder: 1, status: 'INACTIVE' }] } };

  it('shows the author with the role next to each PQRS', async () => {
    routes(list);
    await renderScreen(<AdminPqrsScreen />);
    expect(await screen.findByText('Asunto 1')).toBeTruthy();
    expect(screen.getAllByText('Ana Soto · Estudiante')).toHaveLength(2);
  });

  it('combines the state, the type and the author role in one request, also with a deactivated type', async () => {
    routes(list);
    await renderScreen(<AdminPqrsScreen />);
    await screen.findByText('Asunto 1');
    await fireEvent.press(screen.getByLabelText('En revisión'));
    await fireEvent.press(await screen.findByLabelText('Petición'));
    await fireEvent.press(screen.getByLabelText('Docentes'));
    await waitFor(() => expect(paths()).toContain('/pqrs?page=1&limit=20&status=IN_REVIEW&typeId=t1&authorRole=TEACHER'));
  });

  it('shows the empty states and the error with retry', async () => {
    routes({ 'GET /pqrs?': page([]), 'GET /dropdown-lists/PQRS_TYPE': { key: 'PQRS_TYPE', items: [] } });
    const empty = await renderScreen(<AdminPqrsScreen />);
    expect(await screen.findByText('Aún no hay PQRS')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Docentes'));
    expect(await screen.findByText('Ninguna PQRS coincide')).toBeTruthy();
    await empty.unmount();

    mockedApi.mockImplementation((path: string) =>
      path.startsWith('/pqrs?') ? Promise.reject(new ApiError(500, 'INTERNAL_ERROR')) : Promise.resolve({ key: 'PQRS_TYPE', items: [] }),
    );
    await renderScreen(<AdminPqrsScreen />);
    expect(await screen.findByText('No pudimos cargar las PQRS')).toBeTruthy();
    expect(screen.getByLabelText('Intentar de nuevo')).toBeTruthy();
  });

  it('opens the detail of a PQRS', async () => {
    routes(list);
    await renderScreen(<AdminPqrsScreen />);
    await fireEvent.press(await screen.findByLabelText('Asunto 1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(admin)/pqrs/[id]', params: { id: 'p1' } });
  });
});

describe('AdminPqrsDetailScreen', () => {
  it('FILED: shows the rule and only offers to move it to review, which sends the request', async () => {
    routes({ 'GET /pqrs/limits': LIMITS, 'GET /pqrs/p1': detail(), 'POST /pqrs/p1/review': detail({ status: 'IN_REVIEW' }) });
    await renderScreen(<AdminPqrsDetailScreen />);
    expect(await screen.findByText('Primero pásala a En revisión para poder responderla o resolverla.')).toBeTruthy();
    expect(screen.queryByLabelText('Enviar respuesta')).toBeNull();
    expect(screen.queryByLabelText('Marcar como resuelta')).toBeNull();
    expect(screen.getByText('Ana Soto · Estudiante')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Pasar a En revisión'));
    await waitFor(() => expect(calls('/pqrs/p1/review')).toHaveLength(1));
  });

  it('IN_REVIEW without replies: replying is possible and resolving is blocked with its rule', async () => {
    routes({ 'GET /pqrs/limits': LIMITS, 'GET /pqrs/p1': detail({ status: 'IN_REVIEW' }), 'POST /pqrs/p1/responses': { id: 'm1' } });
    await renderScreen(<AdminPqrsDetailScreen />);
    expect(await screen.findByText('Primero escribe al menos una respuesta para poder resolverla.')).toBeTruthy();
    expect(await screen.findByText('0/2000')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Tu respuesta'), 'Ya lo revisamos');
    await fireEvent.press(screen.getByLabelText('Enviar respuesta'));
    await waitFor(() => expect(calls('/pqrs/p1/responses')).toHaveLength(1));
    expect(calls('/pqrs/p1/responses')[0][1].body).toEqual({ body: 'Ya lo revisamos' });
  });

  it('IN_REVIEW with a reply: resolving asks for confirmation first', async () => {
    const withReply = detail({ status: 'IN_REVIEW', messages: [{ id: 'm1', body: 'Listo', createdAt: '2030-01-09T15:00:00.000Z' }] });
    routes({ 'GET /pqrs/limits': LIMITS, 'GET /pqrs/p1': withReply, 'POST /pqrs/p1/resolve': detail({ status: 'RESOLVED' }) });
    await renderScreen(<AdminPqrsDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('Marcar como resuelta'));
    expect(await screen.findByText('¿Marcar como resuelta?')).toBeTruthy();
    expect(calls('/pqrs/p1/resolve')).toHaveLength(0);
    await fireEvent.press(screen.getAllByLabelText('Marcar como resuelta').at(-1)!);
    await waitFor(() => expect(calls('/pqrs/p1/resolve')).toHaveLength(1));
  });

  it('RESOLVED: shows that it no longer accepts changes and offers no action', async () => {
    routes({ 'GET /pqrs/limits': LIMITS, 'GET /pqrs/p1': detail({ status: 'RESOLVED' }) });
    await renderScreen(<AdminPqrsDetailScreen />);
    expect(await screen.findByText('Esta PQRS está resuelta y ya no admite cambios.')).toBeTruthy();
    for (const label of ['Pasar a En revisión', 'Enviar respuesta', 'Marcar como resuelta']) expect(screen.queryByLabelText(label)).toBeNull();
  });

  it('shows the rule of the server when an action is refused', async () => {
    mockedApi.mockImplementation((path: string, options?: { method?: string }) => {
      if (path === '/pqrs/limits') return Promise.resolve(LIMITS);
      if (options?.method === 'POST') return Promise.reject(new ApiError(409, 'PQRS_INVALID_TRANSITION'));
      return Promise.resolve(detail());
    });
    await renderScreen(<AdminPqrsDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('Pasar a En revisión'));
    expect(await screen.findByText(/El orden es Radicada, En revisión y Resuelta/)).toBeTruthy();
  });

  it('shows an error with retry when the PQRS does not load', async () => {
    mockedApi.mockRejectedValue(new ApiError(404, 'PQRS_NOT_FOUND'));
    await renderScreen(<AdminPqrsDetailScreen />);
    expect(await screen.findByText('No pudimos cargar la PQRS')).toBeTruthy();
    expect(screen.getByLabelText('Intentar de nuevo')).toBeTruthy();
  });
});
