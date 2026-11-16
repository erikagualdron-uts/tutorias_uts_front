import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => ({ email: 'ana@uts.edu.co' }),
}));
jest.mock('@/api/client', () => ({ api: jest.fn() }));

const mockedApi = api as jest.Mock;

const renderWithProviders = (ui: ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
        })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('password recovery flow', () => {
  it('step 1: requests the code and moves to the reset screen with the email', async () => {
    mockedApi.mockResolvedValue({
      resendAvailableAt: new Date().toISOString(),
    });
    await renderWithProviders(<ForgotPasswordScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Correo institucional'),
      'ana@uts.edu.co',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Enviar código' }),
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/reset-password',
        params: { email: 'ana@uts.edu.co' },
      }),
    );
    expect(mockedApi).toHaveBeenCalledWith(
      '/auth/forgot-password',
      expect.objectContaining({ body: { email: 'ana@uts.edu.co' } }),
    );
  });

  it('step 2: sends code and new password, then goes to login with the success notice', async () => {
    mockedApi.mockResolvedValue(undefined);
    await renderWithProviders(<ResetPasswordScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Código de recuperación'),
      '123456',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Nueva contraseña'),
      'Nueva12345',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Restablecer contraseña' }),
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/login',
        params: { reset: '1' },
      }),
    );
    expect(mockedApi).toHaveBeenCalledWith(
      '/auth/reset-password',
      expect.objectContaining({
        body: {
          email: 'ana@uts.edu.co',
          code: '123456',
          newPassword: 'Nueva12345',
        },
      }),
    );
  });

  it.each(['CODE_INVALID', 'CODE_EXPIRED', 'CODE_ATTEMPTS_EXCEEDED'] as const)(
    'shows the translated message for %s',
    async (code) => {
      mockedApi.mockRejectedValue(new ApiError(400, code));
      await renderWithProviders(<ResetPasswordScreen />);

      await fireEvent.changeText(
        screen.getByLabelText('Código de recuperación'),
        '123456',
      );
      await fireEvent.changeText(
        screen.getByLabelText('Nueva contraseña'),
        'Nueva12345',
      );
      await fireEvent.press(
        screen.getByRole('button', { name: 'Restablecer contraseña' }),
      );

      expect(await screen.findByText(i18n.t(`errors.${code}`))).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
    },
  );

  it('does not call the API with a weak password or a short code', async () => {
    await renderWithProviders(<ResetPasswordScreen />);
    await fireEvent.changeText(
      screen.getByLabelText('Código de recuperación'),
      '12',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Nueva contraseña'),
      'corta',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Restablecer contraseña' }),
    );

    expect(await screen.findByText('El código tiene 6 dígitos.')).toBeTruthy();
    expect(mockedApi).not.toHaveBeenCalled();
  });
});
