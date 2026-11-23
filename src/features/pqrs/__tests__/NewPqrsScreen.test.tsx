import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { NewPqrsScreen } from '../screens/NewPqrsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: () => mockBack(), replace: (...a: unknown[]) => mockReplace(...a) } }));
const FILED = { id: 'a1b2c3d4-0000-4000-8000-000000000001', createdAt: '2030-01-08T19:00:00.000Z', status: 'FILED' };

const mockedApi = api as jest.Mock;
const LIMITS = { subjectMaxLength: 120, descriptionMaxLength: 2000, responseMaxLength: 2000 };
const TYPES = [
  { id: 't1', labelEs: 'Petición', labelEn: 'Request', sortOrder: 1, status: 'ACTIVE' },
  { id: 't2', labelEs: 'Queja', labelEn: 'Complaint', sortOrder: 2, status: 'ACTIVE' },
];
const posts = () => mockedApi.mock.calls.filter(([path, options]) => path === '/pqrs' && options?.method === 'POST');

function answer(post: () => Promise<unknown> = () => Promise.resolve(FILED)) {
  mockedApi.mockImplementation((path: string, options?: { method?: string }) => {
    if (path === '/pqrs/limits') return Promise.resolve(LIMITS);
    if (path === '/dropdown-lists/PQRS_TYPE/items') return Promise.resolve(TYPES);
    if (path === '/pqrs' && options?.method === 'POST') return post();
    return Promise.reject(new Error(path));
  });
}
const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <NewPqrsScreen />
    </QueryClientProvider>,
  );
const fill = async (type = 'Queja') => {
  await fireEvent.press(await screen.findByLabelText(type));
  await fireEvent.changeText(screen.getByLabelText('Asunto'), '  Horario  ');
  await fireEvent.changeText(screen.getByLabelText('Descripción'), 'No encuentro el horario');
};

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('NewPqrsScreen', () => {
  it('offers the active types in the language of the device', async () => {
    answer();
    await renderScreen();
    expect(await screen.findByLabelText('Petición')).toBeTruthy();
    expect(screen.getByLabelText('Queja')).toBeTruthy();
    await i18n.changeLanguage('en');
    expect(await screen.findByLabelText('Request')).toBeTruthy();
    expect(screen.getByLabelText('Complaint')).toBeTruthy();
  });

  it('names the missing fields and sends nothing', async () => {
    answer();
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText('Radicar'));
    expect(await screen.findByText('Elige un tipo.')).toBeTruthy();
    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveLength(2);
    expect(posts()).toHaveLength(0);
  });

  it('shows the counters with the limits that the API gives', async () => {
    answer();
    await renderScreen();
    expect(await screen.findByText('0/2000')).toBeTruthy();
  });

  it('files the PQRS with the trimmed text and opens the confirmation instead of going back', async () => {
    answer();
    await renderScreen();
    await fill();
    await fireEvent.press(screen.getByLabelText('Radicar'));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(posts()[0][1].body).toMatchObject({ typeId: 't2', subject: 'Horario', description: 'No encuentro el horario' });
    expect(posts()[0][1].body.clientRequestId).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(student)/pqrs/filed', params: FILED }),
    );
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('leads to the same filing number when a retry gets the same PQRS back', async () => {
    answer();
    await renderScreen();
    await fill();
    await fireEvent.press(screen.getByLabelText('Radicar'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    await fireEvent.press(screen.getByLabelText('Radicar'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(2));
    expect(mockReplace.mock.calls[1][0].params.id).toBe(mockReplace.mock.calls[0][0].params.id);
  });

  it('sends a single request on a double tap', async () => {
    let finish: (value: unknown) => void = () => undefined;
    answer(() => new Promise((resolve) => (finish = resolve)));
    await renderScreen();
    await fill();
    await fireEvent.press(screen.getByLabelText('Radicar'));
    await fireEvent.press(screen.getByLabelText('Radicar'));
    expect(posts()).toHaveLength(1);
    finish(FILED);
  });

  it('keeps the same request key when the first try fails and the user retries', async () => {
    answer(() => Promise.reject(new ApiError(500, 'INTERNAL_ERROR')));
    await renderScreen();
    await fill();
    await fireEvent.press(screen.getByLabelText('Radicar'));
    await waitFor(() => expect(posts()).toHaveLength(1));
    await fireEvent.press(screen.getByLabelText('Radicar'));
    await waitFor(() => expect(posts()).toHaveLength(2));
    expect(posts()[1][1].body.clientRequestId).toBe(posts()[0][1].body.clientRequestId);
  });

  it('explains a type that is no longer available', async () => {
    answer(() => Promise.reject(new ApiError(422, 'PQRS_TYPE_UNAVAILABLE')));
    await renderScreen();
    await fill();
    await fireEvent.press(screen.getByLabelText('Radicar'));
    expect(await screen.findByText('Ese tipo de PQRS ya no está disponible. Elige otro.')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows an error with retry when the types do not load', async () => {
    mockedApi.mockImplementation((path: string) =>
      path === '/pqrs/limits' ? Promise.resolve(LIMITS) : Promise.reject(new ApiError(500, 'INTERNAL_ERROR')),
    );
    await renderScreen();
    expect(await screen.findByText('No pudimos cargar los tipos')).toBeTruthy();
    expect(screen.getByLabelText('Intentar de nuevo')).toBeTruthy();
  });
});
