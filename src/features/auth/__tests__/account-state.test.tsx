import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { LoginScreen } from '../screens/LoginScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

const student = {
  id: '1',
  email: 'ana@uts.edu.co',
  role: 'STUDENT' as const,
  mustChangePassword: false,
  locale: 'es' as const,
};
const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const respond = (status: number, body: object) =>
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

beforeEach(async () => {
  jest.clearAllMocks();
  useSession.setState({
    status: 'signedIn',
    user: student,
    accessToken: 'token',
    signOutReason: null,
  });
  await i18n.changeLanguage('es');
});

describe('account state handling', () => {
  it.each(['ACCOUNT_DISABLED', 'ACCOUNT_UNAVAILABLE'] as const)(
    '%s on an authenticated call closes the local session and keeps the reason',
    async (code) => {
      respond(401, { statusCode: 401, code, message: 'x' });

      await expect(api('/anything')).rejects.toMatchObject({ code });
      expect(useSession.getState().status).toBe('signedOut');
      expect(useSession.getState().user).toBeNull();
      expect(useSession.getState().signOutReason).toBe(code);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it('an expired access token alone does not close the session', async () => {
    respond(401, { statusCode: 401, code: 'TOKEN_INVALID', message: 'x' });
    // No stored refresh token in the test, so the refresh cannot succeed; the original error surfaces.
    await expect(api('/anything')).rejects.toBeInstanceOf(ApiError);
    expect(useSession.getState().signOutReason).toBeNull();
  });
});

describe('LoginScreen with blocked accounts', () => {
  const renderLogin = () =>
    render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
          })
        }
      >
        <LoginScreen />
      </QueryClientProvider>,
    );

  it.each(['ACCOUNT_DISABLED', 'ACCOUNT_UNAVAILABLE'] as const)(
    'explains %s after the session was closed',
    async (code) => {
      useSession.setState({
        status: 'signedOut',
        user: null,
        signOutReason: code,
      });
      await renderLogin();
      expect(screen.getByText(i18n.t(`errors.${code}`))).toBeTruthy();
    },
  );

  it.each(['ACCOUNT_DISABLED', 'ACCOUNT_UNAVAILABLE'] as const)(
    'shows the rule when login answers %s',
    async (code) => {
      useSession.setState({
        status: 'signedOut',
        user: null,
        signOutReason: null,
      });
      respond(403, { statusCode: 403, code, message: 'x' });
      await renderLogin();

      await fireEvent.changeText(
        screen.getByLabelText('Correo institucional'),
        'ana@uts.edu.co',
      );
      await fireEvent.changeText(
        screen.getByLabelText('Contraseña'),
        'Clave1234',
      );
      await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));

      expect(await screen.findByText(i18n.t(`errors.${code}`))).toBeTruthy();
      expect(useSession.getState().status).toBe('signedOut');
    },
  );
});
