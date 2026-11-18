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
import { useSession } from '@/store/session';
import { CreateTeacherScreen } from '@/features/teachers/screens/CreateTeacherScreen';
import { RouteGate } from '../RouteGate';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
  };
});

const mockedApi = api as jest.Mock;
const teacher = {
  id: '1',
  email: 't@correo.uts.edu.co',
  role: 'TEACHER' as const,
  mustChangePassword: true,
  locale: 'es' as const,
};

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

describe('CreateTeacherScreen', () => {
  const fill = async (email: string) => {
    await fireEvent.changeText(screen.getByLabelText('Nombres'), 'Luis');
    await fireEvent.changeText(screen.getByLabelText('Apellidos'), 'Gómez');
    await fireEvent.changeText(
      screen.getByLabelText('Correo institucional'),
      email,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Crear docente' }),
    );
  };

  it('shows the temporary password once and drops it when the dialog closes', async () => {
    mockedApi.mockResolvedValue({
      user: teacher,
      temporaryPassword: 'Abc123Xyz789',
    });
    await renderWithProviders(<CreateTeacherScreen />);
    await fill('t@correo.uts.edu.co');

    expect(await screen.findByText('Abc123Xyz789')).toBeTruthy();
    expect(
      screen.getByText('El docente deberá cambiarla en su primer ingreso.'),
    ).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByText('Abc123Xyz789')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copiar' })).toBeNull();
  });

  it('shows the domain error inline under the email field', async () => {
    mockedApi.mockRejectedValue(new ApiError(422, 'EMAIL_DOMAIN_NOT_ALLOWED'));
    await renderWithProviders(<CreateTeacherScreen />);
    await fill('t@gmail.com');

    expect(
      await screen.findByText(i18n.t('errors.EMAIL_DOMAIN_NOT_ALLOWED')),
    ).toBeTruthy();
    expect(screen.queryByText('Contraseña temporal')).toBeNull();
  });
});

describe('forced password change', () => {
  it('keeps a teacher with a temporary password on the change screen, away from the tabs', async () => {
    useSession.setState({ status: 'signedIn', user: teacher });
    await renderWithProviders(
      <RouteGate expected="/(teacher)">
        <ChangePasswordScreen />
      </RouteGate>,
    );
    expect(screen.getByText('redirect:/change-password')).toBeTruthy();
  });

  it('clears the obligation after a successful change', async () => {
    useSession.setState({ status: 'signedIn', user: teacher });
    mockedApi.mockResolvedValue(undefined);
    await renderWithProviders(<ChangePasswordScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Contraseña actual'),
      'Temporal123',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Nueva contraseña'),
      'Nueva12345',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Cambiar contraseña' }),
    );

    await waitFor(() =>
      expect(useSession.getState().user?.mustChangePassword).toBe(false),
    );
  });

  it('shows the translated error when the new password equals the current one', async () => {
    useSession.setState({ status: 'signedIn', user: teacher });
    mockedApi.mockRejectedValue(new ApiError(400, 'PASSWORD_SAME_AS_CURRENT'));
    await renderWithProviders(<ChangePasswordScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Contraseña actual'),
      'Temporal123',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Nueva contraseña'),
      'Temporal123',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Cambiar contraseña' }),
    );

    expect(
      await screen.findByText(i18n.t('errors.PASSWORD_SAME_AS_CURRENT')),
    ).toBeTruthy();
  });
});
