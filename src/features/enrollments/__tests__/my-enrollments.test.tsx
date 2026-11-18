import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { StudentModulesScreen } from '../screens/StudentModulesScreen';
import { itemOf, itemsPage, offerOf, offerPage } from '../test-fixtures';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn() } }));

const mockedApi = api as jest.Mock;
let mine: () => Promise<unknown>;

const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <StudentModulesScreen />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  mine = () => Promise.resolve(itemsPage([itemOf()]));
  mockedApi.mockImplementation((path: string) =>
    path.startsWith('/student/enrollments') ? mine() : Promise.resolve(offerPage([offerOf()])),
  );
  await i18n.changeLanguage('es');
});

const openMine = async () => {
  await renderScreen();
  await fireEvent.press(await screen.findByLabelText('Mis tutorías'));
};

describe('"My tutoring" segment', () => {
  it('lists the enrolled modules with teacher, room, schedule and next session in Bogota time', async () => {
    await openMine();
    expect(await screen.findByText('Cálculo I')).toBeTruthy();
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('A-101 · Sede Central')).toBeTruthy();
    expect(screen.getByText('Mar 14:00–16:00')).toBeTruthy();
    // 2030-01-08T19:00Z is 14:00 in Bogota
    expect(screen.getByText(/Próxima sesión: .* · 14:00/)).toBeTruthy();
    expect(screen.getByText('Activa')).toBeTruthy();
  });

  it('asks only for the active enrollments', async () => {
    await openMine();
    await screen.findByText('Cálculo I');
    expect(mockedApi).toHaveBeenCalledWith('/student/enrollments?status=ACTIVE&limit=100');
  });

  it('opens the detail of a module', async () => {
    await openMine();
    await fireEvent.press(await screen.findByLabelText('Cálculo I'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/modules/[id]', params: { id: 'm1' } });
  });

  it('shows a closed-period module as read only', async () => {
    mine = () => Promise.resolve(itemsPage([itemOf({ readOnly: true, nextSession: null })]));
    await openMine();
    expect(await screen.findByText('Periodo cerrado')).toBeTruthy();
    expect(screen.getByText('Sin sesiones próximas')).toBeTruthy();
  });

  it('shows the empty state with the way to the offer', async () => {
    mine = () => Promise.resolve(itemsPage([]));
    await openMine();
    expect(await screen.findByText('Aún no estás inscrito')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Ver tutorías disponibles'));
    expect(await screen.findByLabelText('Buscar tutoría por nombre')).toBeTruthy();
  });

  it('shows the error with a retry', async () => {
    mine = () => Promise.reject(new ApiError(500, 'INTERNAL_ERROR'));
    await openMine();
    expect(await screen.findByText('No pudimos cargar tus tutorías')).toBeTruthy();
    mine = () => Promise.resolve(itemsPage([itemOf()]));
    await fireEvent.press(screen.getByLabelText('Intentar de nuevo'));
    expect(await screen.findByText('Cálculo I')).toBeTruthy();
  });

  it('shows nothing but the loader while loading', async () => {
    mine = () => new Promise(() => undefined);
    await openMine();
    expect(screen.queryByText('Aún no estás inscrito')).toBeNull();
    expect(screen.queryByText('Cálculo I')).toBeNull();
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText('My tutoring'));
    expect(await screen.findByText('Active')).toBeTruthy();
  });
});
