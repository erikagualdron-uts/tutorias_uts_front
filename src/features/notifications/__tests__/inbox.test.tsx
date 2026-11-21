import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { AppNotification, NotificationPage } from '@/api/types';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { NotificationsBell } from '../components/NotificationsBell';
import { NotificationsScreen } from '../screens/NotificationsScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const mockedApi = api as jest.Mock;
const READ_AT = '2030-01-08T20:00:00.000Z';

const notice = (n: number, overrides: Partial<AppNotification> = {}): AppNotification => ({
  id: `n-${n}`,
  type: 'SESSION_CANCELLED_TEACHER',
  moduleId: `m-${n}`,
  title: `Se canceló tu tutoría ${n}`,
  body: `Cuerpo ${n}`,
  readAt: null,
  createdAt: '2030-01-08T19:00:00.000Z',
  ...overrides,
});
const page = (data: AppNotification[], p = 1, total = data.length): NotificationPage => ({
  data,
  meta: { page: p, limit: 20, total },
});

let unread = 2;
let inbox: (path: string) => Promise<unknown>;

const wrap = (node: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider>
);

beforeEach(async () => {
  jest.clearAllMocks();
  unread = 2;
  inbox = () => Promise.resolve(page([notice(1), notice(2)]));
  mockedApi.mockImplementation((path: string) => {
    if (path === '/notifications/unread-count') return Promise.resolve({ unread });
    if (path === '/notifications/read-all') {
      unread = 0;
      return Promise.resolve({ updated: 2 });
    }
    if (path.endsWith('/read')) {
      unread -= 1;
      return Promise.resolve(notice(1, { readAt: READ_AT }));
    }
    return inbox(path);
  });
  useSession.setState({
    status: 'signedIn',
    accessToken: 't',
    user: { id: 'u', email: 's@uts.edu.co', role: 'STUDENT', mustChangePassword: false } as never,
  });
  await i18n.changeLanguage('es');
});

describe('notifications inbox', () => {
  it('shows the notices with the unread ones marked as text (scenario 1)', async () => {
    await render(wrap(<NotificationsScreen />));
    expect(await screen.findByText('Se canceló tu tutoría 1')).toBeTruthy();
    expect(screen.getByText('Se canceló tu tutoría 2')).toBeTruthy();
    expect(screen.getAllByText('Sin leer')).toHaveLength(2);
    expect(screen.getByText('Marcar todo como leído')).toBeTruthy();
  });

  it('does not mark a read notice as unread', async () => {
    inbox = () => Promise.resolve(page([notice(1), notice(2, { readAt: READ_AT })]));
    await render(wrap(<NotificationsScreen />));
    await screen.findByText('Se canceló tu tutoría 2');
    expect(screen.getAllByText('Sin leer')).toHaveLength(1);
  });

  it('marks the notice as read and opens its module on tap (scenario 2)', async () => {
    await render(wrap(<NotificationsScreen />));
    fireEvent.press(await screen.findByText('Se canceló tu tutoría 1'));
    await waitFor(() => expect(mockedApi).toHaveBeenCalledWith('/notifications/n-1/read', { method: 'POST' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/(student)/modules/[id]', params: { id: 'm-1' } });
  });

  it('opens the module without marking an already read notice', async () => {
    inbox = () => Promise.resolve(page([notice(1, { readAt: READ_AT })]));
    await render(wrap(<NotificationsScreen />));
    fireEvent.press(await screen.findByText('Se canceló tu tutoría 1'));
    expect(router.push).toHaveBeenCalled();
    expect(mockedApi).not.toHaveBeenCalledWith('/notifications/n-1/read', expect.anything());
  });

  it('marks all as read (scenario 3)', async () => {
    await render(wrap(<NotificationsScreen />));
    fireEvent.press(await screen.findByText('Marcar todo como leído'));
    await waitFor(() => expect(mockedApi).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' }));
  });

  it('explains an empty inbox and offers no mark-all button (scenario 4)', async () => {
    inbox = () => Promise.resolve(page([]));
    await render(wrap(<NotificationsScreen />));
    expect(await screen.findByText('No tienes notificaciones')).toBeTruthy();
    expect(screen.queryByText('Marcar todo como leído')).toBeNull();
  });

  it('shows the error with a retry that works (scenario 5)', async () => {
    inbox = () => Promise.reject(new ApiError(0, 'NETWORK'));
    await render(wrap(<NotificationsScreen />));
    expect(await screen.findByText('No pudimos cargar tus notificaciones')).toBeTruthy();
    expect(screen.getByText('No hay conexión con el servidor. Revisa tu internet.')).toBeTruthy();
    inbox = () => Promise.resolve(page([notice(1)]));
    fireEvent.press(screen.getByText('Intentar de nuevo'));
    expect(await screen.findByText('Se canceló tu tutoría 1')).toBeTruthy();
  });

  it('loads the earlier notices when the end of the list is reached (scenario 6)', async () => {
    inbox = (path) =>
      Promise.resolve(
        path.includes('page=2') ? page([notice(21)], 2, 21) : page(Array.from({ length: 20 }, (_, i) => notice(i + 1)), 1, 21),
      );
    await render(wrap(<NotificationsScreen />));
    await screen.findByText('Se canceló tu tutoría 1');
    fireEvent(screen.getByTestId('notifications-list'), 'endReached');
    await waitFor(() => expect(mockedApi).toHaveBeenCalledWith('/notifications?page=2&limit=20'));
  });

  it('writes the texts in English when the device is in English', async () => {
    await i18n.changeLanguage('en');
    inbox = () => Promise.resolve(page([]));
    await render(wrap(<NotificationsScreen />));
    expect(await screen.findByText('You have no notifications')).toBeTruthy();
  });
});

describe('notifications bell', () => {
  it('shows the unread counter and leads to the inbox of the role', async () => {
    await render(wrap(<NotificationsBell />));
    expect(await screen.findByText('2')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Notificaciones, 2 sin leer'));
    expect(router.push).toHaveBeenCalledWith('/(student)/notifications');
  });

  it('hides the badge with nothing unread', async () => {
    unread = 0;
    await render(wrap(<NotificationsBell />));
    expect(await screen.findByLabelText('Notificaciones')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('caps the counter at 99+', async () => {
    unread = 250;
    await render(wrap(<NotificationsBell />));
    expect(await screen.findByText('99+')).toBeTruthy();
  });
});
