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
import { RegisterScreen } from '../screens/RegisterScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
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
  mockParams = {};
  await i18n.changeLanguage('es');
});

describe('RegisterScreen', () => {
  it('shows the password requirements and marks the ones that are met', async () => {
    await renderWithProviders(<RegisterScreen />);
    expect(screen.getByText('• Al menos 8 caracteres')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText('Contraseña'),
      'Clave1234',
    );
    expect(screen.getByText('✓ Al menos 8 caracteres')).toBeTruthy();
    expect(screen.getByText('✓ Una letra')).toBeTruthy();
    expect(screen.getByText('✓ Un número')).toBeTruthy();
  });

  it('shows the translated domain error returned by the API', async () => {
    mockedApi.mockRejectedValue(new ApiError(422, 'EMAIL_DOMAIN_NOT_ALLOWED'));
    await renderWithProviders(<RegisterScreen />);

    await fireEvent.changeText(screen.getByLabelText('Nombres'), 'Ana');
    await fireEvent.changeText(screen.getByLabelText('Apellidos'), 'Pérez');
    await fireEvent.changeText(
      screen.getByLabelText('Correo institucional'),
      'ana@gmail.com',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Contraseña'),
      'Clave1234',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Registrarme' }));

    expect(
      await screen.findByText(i18n.t('errors.EMAIL_DOMAIN_NOT_ALLOWED')),
    ).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('goes to the verification screen after a successful registration', async () => {
    const resendAvailableAt = new Date(Date.now() + 60_000).toISOString();
    mockedApi.mockResolvedValue({ resendAvailableAt });
    await renderWithProviders(<RegisterScreen />);

    await fireEvent.changeText(screen.getByLabelText('Nombres'), 'Ana');
    await fireEvent.changeText(screen.getByLabelText('Apellidos'), 'Pérez');
    await fireEvent.changeText(
      screen.getByLabelText('Correo institucional'),
      'ana@uts.edu.co',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Contraseña'),
      'Clave1234',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Registrarme' }));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/verify-email',
        params: { email: 'ana@uts.edu.co', resendAvailableAt },
      }),
    );
  });
});

describe('VerifyEmailScreen', () => {
  it('disables the resend button with the remaining seconds until the cooldown ends', async () => {
    mockParams = {
      email: 'ana@uts.edu.co',
      resendAvailableAt: new Date(Date.now() + 45_000).toISOString(),
    };
    await renderWithProviders(<VerifyEmailScreen />);

    expect(
      screen.getByRole('button', { name: 'Reenviar código' }).props
        .accessibilityState.disabled,
    ).toBe(true);
    expect(
      screen.getByText(/Podrás reenviar el código en (44|45) s/),
    ).toBeTruthy();
  });

  it('shows the translated error for a wrong code', async () => {
    mockParams = {
      email: 'ana@uts.edu.co',
      resendAvailableAt: new Date(0).toISOString(),
    };
    mockedApi.mockRejectedValue(new ApiError(400, 'CODE_INVALID'));
    await renderWithProviders(<VerifyEmailScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Código de verificación'),
      '123456',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('El código no es correcto.')).toBeTruthy();
  });
});
