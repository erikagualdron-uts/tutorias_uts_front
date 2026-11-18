import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { Role } from '@/api/types';
import { useSession } from '@/store/session';
import { RouteGate } from '../RouteGate';
import { ROLE_HOME, routeFor } from '../routing';

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => (
      <MockText>{`redirect:${href}`}</MockText>
    ),
  };
});

const user = (role: Role, mustChangePassword = false) => ({
  id: '1',
  email: 'a@uts.edu.co',
  role,
  mustChangePassword,
  locale: 'es' as const,
});

describe('routeFor', () => {
  it('sends a signed-out session to login', () => {
    expect(routeFor({ status: 'signedOut', user: null })).toBe('/login');
  });

  it.each(['STUDENT', 'TEACHER', 'SUPERADMIN'] as const)(
    'sends %s to its own group',
    (role) => {
      expect(routeFor({ status: 'signedIn', user: user(role) })).toBe(
        ROLE_HOME[role],
      );
    },
  );

  it('forces the password change before any group', () => {
    expect(routeFor({ status: 'signedIn', user: user('TEACHER', true) })).toBe(
      '/change-password',
    );
  });
});

describe('RouteGate', () => {
  const setSession = (status: 'signedOut' | 'signedIn', role?: Role) =>
    useSession.setState({ status, user: role ? user(role) : null });

  it('renders its content for the matching role', async () => {
    setSession('signedIn', 'STUDENT');
    await render(
      <RouteGate expected="/(student)">
        <Text>student tabs</Text>
      </RouteGate>,
    );
    expect(screen.getByText('student tabs')).toBeTruthy();
  });

  it('redirects a wrong role to its own group', async () => {
    setSession('signedIn', 'STUDENT');
    await render(
      <RouteGate expected="/(admin)">
        <Text>admin tabs</Text>
      </RouteGate>,
    );
    expect(screen.queryByText('admin tabs')).toBeNull();
    expect(screen.getByText('redirect:/(student)')).toBeTruthy();
  });

  it('redirects without a session to login', async () => {
    setSession('signedOut');
    await render(
      <RouteGate expected="/(teacher)">
        <Text>teacher tabs</Text>
      </RouteGate>,
    );
    expect(screen.getByText('redirect:/login')).toBeTruthy();
  });
});
