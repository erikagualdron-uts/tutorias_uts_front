import { render, screen } from '@testing-library/react-native';
import { existsSync } from 'fs';
import { join } from 'path';
import { Text } from 'react-native';
import type { Role } from '@/api/types';
import { useSession } from '@/store/session';
import { RouteGate } from '../RouteGate';
import { ROLE_HOME } from '../routing';

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => (
      <MockText>{`redirect:${href}`}</MockText>
    ),
  };
});

const APP = join(__dirname, '..', '..', '..', '..', 'app');
// Screens of the CAE configuration (spec 006); every one must live inside the CAE group.
const CONFIG_ROUTES = [
  'more/periods',
  'more/period-form',
  'more/dropdown-lists',
  'more/dropdown-items',
  'more/dropdown-item-form',
  'modules/room-form',
  'modules/locations',
  'modules/location-form',
];

describe('CAE configuration routes', () => {
  it.each(CONFIG_ROUTES)('%s exists only in the CAE group', (route) => {
    expect(existsSync(join(APP, '(admin)', `${route}.tsx`))).toBe(true);
    for (const group of ['(teacher)', '(student)']) {
      expect(existsSync(join(APP, group, `${route}.tsx`))).toBe(false);
    }
  });

  it.each(['TEACHER', 'STUDENT'] as const)(
    'sends a %s away from the CAE group to its own home',
    async (role: Exclude<Role, 'SUPERADMIN'>) => {
      useSession.setState({
        status: 'signedIn',
        user: {
          id: '1',
          email: 'a@uts.edu.co',
          role,
          mustChangePassword: false,
          locale: 'es',
        },
      });
      await render(
        <RouteGate expected={ROLE_HOME.SUPERADMIN}>
          <Text>configuration</Text>
        </RouteGate>,
      );
      expect(screen.queryByText('configuration')).toBeNull();
      expect(screen.getByText(`redirect:${ROLE_HOME[role]}`)).toBeTruthy();
    },
  );
});
