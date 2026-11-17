import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api, refreshSession } from '@/api/client';
import { AppBar } from '@/components/AppBar';
import i18n from '@/i18n';
import { loadRefreshToken } from '@/store/secureSession';
import { useSession } from '@/store/session';
import { useRestoreSession } from '@/store/useRestoreSession';

jest.mock('@/api/client', () => ({
  api: jest.fn(),
  refreshSession: jest.fn(),
}));
jest.mock('@/store/secureSession', () => ({
  loadRefreshToken: jest.fn(),
  saveRefreshToken: jest.fn(async () => undefined),
  clearRefreshToken: jest.fn(async () => undefined),
}));

const student = {
  id: '1',
  email: 'ana@uts.edu.co',
  role: 'STUDENT' as const,
  mustChangePassword: false,
  locale: 'es' as const,
  firstName: 'Ana',
  lastName: 'Pérez',
};

beforeEach(async () => {
  jest.clearAllMocks();
  useSession.setState({
    status: 'loading',
    user: null,
    accessToken: null,
    signOutReason: null,
  });
  await i18n.changeLanguage('es');
});

describe('session restore', () => {
  it('enters the app when the stored token renews', async () => {
    (loadRefreshToken as jest.Mock).mockResolvedValue('stored');
    (refreshSession as jest.Mock).mockImplementation(async () => {
      useSession.setState({
        status: 'signedIn',
        user: student,
        accessToken: 'a',
      });
      return true;
    });
    await renderHook(() => useRestoreSession());
    await waitFor(() => expect(useSession.getState().status).toBe('signedIn'));
  });

  it('asks for login with the reason when the server rejects the token', async () => {
    (loadRefreshToken as jest.Mock).mockResolvedValue('stored');
    (refreshSession as jest.Mock).mockImplementation(async () => {
      await useSession.getState().signOut('SESSION_EXPIRED');
      return false;
    });
    await renderHook(() => useRestoreSession());
    await waitFor(() => expect(useSession.getState().status).toBe('signedOut'));
    expect(useSession.getState().signOutReason).toBe('SESSION_EXPIRED');
  });

  it('goes to login without a notice when there is no stored token', async () => {
    (loadRefreshToken as jest.Mock).mockResolvedValue(null);
    await renderHook(() => useRestoreSession());
    await waitFor(() => expect(useSession.getState().status).toBe('signedOut'));
    expect(useSession.getState().signOutReason).toBeNull();
  });

  it('explains an unreachable server instead of dropping the token', async () => {
    (loadRefreshToken as jest.Mock).mockResolvedValue('stored');
    (refreshSession as jest.Mock).mockResolvedValue(false);
    await renderHook(() => useRestoreSession());
    await waitFor(() =>
      expect(useSession.getState().signOutReason).toBe('NETWORK'),
    );
  });
});

describe('AppBar sign out', () => {
  it('closes the session on the server and clears it locally from the profile menu', async () => {
    useSession.setState({
      status: 'signedIn',
      user: student,
      accessToken: 'a',
    });
    (api as jest.Mock).mockResolvedValue(undefined);
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 360, height: 640 },
          insets: { top: 24, left: 0, right: 0, bottom: 0 },
        }}
      >
        <AppBar title="Inicio" />
      </SafeAreaProvider>,
    );

    expect(screen.getByText('AP')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Menú de perfil' }),
    );
    await fireEvent.press(screen.getByText('Cerrar sesión'));

    await waitFor(() => expect(useSession.getState().status).toBe('signedOut'));
    expect(api).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
    expect(useSession.getState().user).toBeNull();
  });
});
