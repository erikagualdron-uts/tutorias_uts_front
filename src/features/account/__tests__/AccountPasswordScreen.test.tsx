import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { AccountPasswordScreen } from '../screens/AccountPasswordScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

const mockedApi = api as jest.Mock;

const open = async () => {
  await render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <AccountPasswordScreen />
    </QueryClientProvider>,
  );
};
const fill = async (current: string, next: string) => {
  await fireEvent.changeText(screen.getByLabelText(i18n.t('changePassword.current')), current);
  await fireEvent.changeText(screen.getByLabelText(i18n.t('changePassword.new')), next);
};
const submit = async () => fireEvent.press(screen.getByRole('button', { name: 'Cambiar contraseña' }));

beforeEach(async () => {
  jest.clearAllMocks();
  useSession.setState({
    status: 'signedIn',
    accessToken: 't',
    user: { id: 'u', email: 'a@uts.edu.co', role: 'TEACHER', mustChangePassword: false } as never,
  });
  await i18n.changeLanguage('es');
});

describe('AccountPasswordScreen', () => {
  it('changes the password, goes back to the account and keeps the session', async () => {
    mockedApi.mockResolvedValue(undefined);
    await open();
    await fill('Actual123', 'Nueva1234');
    await submit();
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: 'Actual123', newPassword: 'Nueva1234' },
      }),
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/(teacher)/account',
        params: { passwordChanged: '1' },
      }),
    );
    expect(useSession.getState().status).toBe('signedIn');
    expect(mockedApi).not.toHaveBeenCalledWith('/auth/logout', expect.anything());
  });

  it('shows the backend error in a banner and keeps what was typed', async () => {
    mockedApi.mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS'));
    await open();
    await fill('Mala12345', 'Nueva1234');
    await submit();
    await waitFor(() => expect(screen.getByText(i18n.t('errors.INVALID_CREDENTIALS'))).toBeTruthy());
    expect(screen.getByLabelText(i18n.t('changePassword.current')).props.value).toBe('Mala12345');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('shows the field error and does not call the endpoint with an invalid new password', async () => {
    await open();
    await fill('Actual123', 'corta');
    await submit();
    await waitFor(() => expect(screen.getByText(i18n.t('validation.password'))).toBeTruthy());
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('has a single primary button with an icon', async () => {
    await open();
    expect(screen.getAllByRole('button').filter((b) => b.props.accessibilityLabel === 'Cambiar contraseña')).toHaveLength(1);
  });
});
