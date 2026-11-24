import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { ChangesScreen } from '../screens/ChangesScreen';
import { mockedApi, renderScreen } from '../testing/personTestUtils';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) }, useFocusEffect: jest.fn() }));

const change = (n: number) => ({
  sessionId: `s${n}`,
  moduleId: `m${n}`,
  moduleName: `Módulo ${n}`,
  kind: 'CANCELLED',
  originalStartsAt: '2030-01-08T19:00:00.000Z',
  startsAt: '2030-01-08T19:00:00.000Z',
  changedAt: new Date(Date.now() - 3_600_000).toISOString(),
});
const pageOf = (data: unknown[], total: number, page = 1) => ({ data, meta: { page, limit: 20, total } });

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('ChangesScreen', () => {
  it('lists the changes and opens the module of a row', async () => {
    mockedApi.mockResolvedValue(pageOf([change(1), change(2)], 2));
    await renderScreen(<ChangesScreen />);
    expect(await screen.findByText('Módulo 1')).toBeTruthy();
    expect(screen.getAllByText('Cancelada · hace 1 h')).toHaveLength(2);
    await fireEvent.press(screen.getByLabelText('Módulo 2, Cancelada'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(admin)/modules/[id]', params: { id: 'm2' } });
  });

  it('opens with the brand header and the total', async () => {
    mockedApi.mockResolvedValue(pageOf([change(1), change(2)], 2));
    await renderScreen(<ChangesScreen />);
    expect(await screen.findByRole('header', { name: i18n.t('dashboard.admin.changes.title') })).toBeTruthy();
    expect(await screen.findByText('2')).toBeTruthy();
  });

  it('loads the next page at the end of the list', async () => {
    mockedApi.mockImplementation((path: string) =>
      Promise.resolve(path.includes('page=2') ? pageOf([change(21)], 21, 2) : pageOf(Array.from({ length: 20 }, (_, i) => change(i + 1)), 21)),
    );
    await renderScreen(<ChangesScreen />);
    await screen.findByText('Módulo 1');
    await fireEvent(screen.getByTestId('changes-list'), 'endReached');
    // the list renders in batches, so the proof is the request of page 2
    await waitFor(() => expect(mockedApi).toHaveBeenCalledWith(expect.stringContaining('page=2')));
  });

  it('shows the empty state and the error with retry', async () => {
    mockedApi.mockResolvedValueOnce(pageOf([], 0));
    await renderScreen(<ChangesScreen />);
    expect(await screen.findByText('No hay cancelaciones ni reprogramaciones recientes.')).toBeTruthy();
  });

  it('offers to retry when the list fails', async () => {
    mockedApi.mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR'));
    await renderScreen(<ChangesScreen />);
    expect(await screen.findByText('No pudimos cargar este bloque')).toBeTruthy();
    expect(screen.getByText('Intentar de nuevo')).toBeTruthy();
  });
});
