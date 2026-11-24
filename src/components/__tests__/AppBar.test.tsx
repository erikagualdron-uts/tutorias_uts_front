import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Role } from '@/api/types';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { AppBar } from '../AppBar';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/notifications/components/NotificationsBell', () => ({
  NotificationsBell: () => null,
}));
const mockSignOut = jest.fn();
jest.mock('@/features/auth/hooks/useSignOut', () => ({ useSignOut: () => mockSignOut }));

const openMenu = async (role: Role) => {
  useSession.setState({
    status: 'signedIn',
    user: { id: 'u', email: 'a@uts.edu.co', role, mustChangePassword: false } as never,
  });
  await render(
    <SafeAreaProvider
      initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}
    >
      <AppBar title="Inicio" />
    </SafeAreaProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: i18n.t('profile.menu') }));
};

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('AppBar avatar menu', () => {
  it('offers My account and Sign out', async () => {
    await openMenu('STUDENT');
    expect(screen.getByRole('menuitem', { name: 'Mi cuenta' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeTruthy();
  });

  it.each([
    ['STUDENT', '/(student)/account'],
    ['TEACHER', '/(teacher)/account'],
    ['SUPERADMIN', '/(admin)/account'],
  ] as const)('opens the account of a %s and closes the menu', async (role, href) => {
    await openMenu(role);
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Mi cuenta' }));
    expect(router.push).toHaveBeenCalledWith(href);
    expect(screen.queryByRole('menuitem', { name: 'Mi cuenta' })).toBeNull();
  });

  it('keeps signing out', async () => {
    await openMenu('TEACHER');
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
