import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Role } from '@/api/types';
import i18n from '@/i18n';
import { enablePush, pushPermission } from '@/features/notifications/push';
import { useSession } from '@/store/session';
import { AccountScreen } from '../screens/AccountScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/features/notifications/push', () => ({
  pushPermission: jest.fn(),
  enablePush: jest.fn(),
}));
const mockSignOut = jest.fn();
jest.mock('@/features/auth/hooks/useSignOut', () => ({ useSignOut: () => mockSignOut }));

const mockedPermission = pushPermission as jest.Mock;
const mockedEnable = enablePush as jest.Mock;
const mockedParams = useLocalSearchParams as jest.Mock;

const signIn = (role: Role, extra: Record<string, unknown> = {}) =>
  useSession.setState({
    status: 'signedIn',
    accessToken: 't',
    user: {
      id: 'u',
      email: 'ana@uts.edu.co',
      role,
      mustChangePassword: false,
      firstName: 'Ana',
      lastName: 'Pérez',
      ...extra,
    } as never,
  });

// The push state is read after the first render; tests that depend on it use findBy.
const open = () => render(<AccountScreen />);

beforeEach(async () => {
  jest.clearAllMocks();
  mockedParams.mockReturnValue({});
  mockedPermission.mockResolvedValue('granted');
  mockedEnable.mockResolvedValue(undefined);
  signIn('STUDENT');
  await i18n.changeLanguage('es');
});

describe('AccountScreen: data', () => {
  it.each([
    ['STUDENT', 'Estudiante'],
    ['TEACHER', 'Docente'],
    ['SUPERADMIN', 'CAE'],
  ] as const)('shows the name, email and role of a %s', async (role, label) => {
    signIn(role);
    await open();
    expect(screen.getByRole('header', { name: 'Mi cuenta' })).toBeTruthy();
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('ana@uts.edu.co')).toBeTruthy();
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('uses the email as the identifier when there is no name', async () => {
    signIn('STUDENT', { firstName: undefined, lastName: undefined });
    await open();
    expect(screen.getAllByText('ana@uts.edu.co').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nombre')).toBeNull();
  });

  it('has the same labels for the three roles and no account administration', async () => {
    for (const role of ['STUDENT', 'TEACHER', 'SUPERADMIN'] as const) {
      signIn(role);
      await open();
      for (const label of ['Correo institucional', 'Rol', 'Notificaciones']) {
        expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      }
      expect(screen.queryByText(/crear|activar cuenta|desactivar/i)).toBeNull();
      await screen.unmount();
    }
  });
});

describe('AccountScreen: password and sign out', () => {
  it('opens the voluntary password screen of the role', async () => {
    signIn('TEACHER');
    await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(router.push).toHaveBeenCalledWith('/(teacher)/account-password');
  });

  it('shows the confirmation only when it comes from a password change', async () => {
    await open();
    expect(screen.queryByText('Tu contraseña se cambió')).toBeNull();
    await screen.unmount();
    mockedParams.mockReturnValue({ passwordChanged: '1' });
    await open();
    expect(screen.getByText('Tu contraseña se cambió')).toBeTruthy();
  });

  it('signs out from the screen and keeps one primary button', async () => {
    await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button', { name: 'Cambiar contraseña' })).toHaveLength(1);
  });
});

describe('AccountScreen: notifications', () => {
  it('shows them on without an enable button when granted', async () => {
    await open();
    expect(await screen.findByText('Activadas')).toBeTruthy();
    expect(screen.queryByRole('button', { name: i18n.t('notifications.push.enable') })).toBeNull();
  });

  it('offers to enable them when undecided and turns them on', async () => {
    mockedPermission.mockResolvedValueOnce('undetermined').mockResolvedValue('granted');
    await open();
    expect(await screen.findByText('Sin activar')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: i18n.t('notifications.push.enable') }));
    expect(mockedEnable).toHaveBeenCalled();
    expect(await screen.findByText('Activadas')).toBeTruthy();
  });

  it.each(['denied', 'unavailable'])(
    'explains how to turn them on when %s, with no button',
    async (state) => {
      mockedPermission.mockResolvedValue(state);
      await open();
      expect(await screen.findByText(i18n.t('account.notifications.blocked'))).toBeTruthy();
      expect(screen.queryByRole('button', { name: i18n.t('notifications.push.enable') })).toBeNull();
    },
  );
});
