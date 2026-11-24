import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import fs from 'fs';
import path from 'path';
import { Text } from 'react-native';
import { api } from '@/api/client';
import type { Role } from '@/api/types';
import { ROLE_HOME } from '@/features/auth/routing';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { RoleTabs } from '../RoleTabs';
import { ROLE_TABS } from '../roleTabs.config';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('@/features/chat/hooks/useChatSocket', () => ({ useChatSocket: () => undefined }));
jest.mock('@/features/notifications/components/PushRegistration', () => ({ PushRegistration: () => null }));

// The real router and the real RoleTabs; only the screens are stand-ins (spec 024).
const ROLES = Object.keys(ROLE_TABS) as Role[];
const page = (label: string) => {
  const Page = () => <Text>{label}</Text>;
  return Page;
};
const group = (role: Role) => ROLE_HOME[role].slice(1); // '(student)'

const routes = (role: Role) => {
  const { tabs, hidden } = ROLE_TABS[role];
  return {
    [`${group(role)}/_layout`]: () => (
      <QueryClientProvider client={new QueryClient()}>
        <RoleTabs role={role} tabs={tabs} hidden={hidden} />
      </QueryClientProvider>
    ),
    ...Object.fromEntries([...tabs, ...hidden].map(({ name }) => [`${group(role)}/${name}`, page(`screen:${name}`)])),
    login: page('screen:login'),
    'change-password': page('screen:change-password'),
  };
};

const signIn = (role: Role, mustChangePassword = false) =>
  useSession.setState({ status: 'signedIn', accessToken: 't', user: { id: 'u', email: 'a@uts.edu.co', role, mustChangePassword } as never });

const open = async (role: Role, initial = '') => {
  signIn(role);
  await renderRouter(routes(role), { initialUrl: `/${group(role)}${initial}` });
};
const go = (href: string) => act(async () => router.navigate(href as never));
const bell = () => screen.findByLabelText(/^Notificaciones/);

beforeEach(async () => {
  await i18n.changeLanguage('es');
  (api as jest.Mock).mockImplementation((path: string) =>
    Promise.resolve(path.includes('unread-count') ? { unread: 2 } : { data: [], meta: { page: 1, limit: 20, total: 0 } }),
  );
});

describe.each(ROLES)('the bell of %s', (role) => {
  const other = ROLE_TABS[role].tabs.find((tab) => tab.name !== 'index')!;

  it('opens the inbox from the first tab', async () => {
    await open(role);
    await fireEvent.press(await bell());
    await waitFor(() => expect(screen).toHavePathname('/notifications'));
    expect(screen.getByText('screen:notifications')).toBeTruthy();
  });

  it('opens the inbox from another tab and back returns to that tab', async () => {
    await open(role);
    await go(`/${other.name}`);
    await fireEvent.press(await bell());
    await waitFor(() => expect(screen).toHavePathname('/notifications'));
    await act(async () => router.back());
    expect(screen).toHavePathname(`/${other.name}`);
  });

  it('does not stack a second inbox when it is tapped again', async () => {
    await open(role);
    await go(`/${other.name}`);
    await fireEvent.press(await bell());
    await fireEvent.press(await bell());
    await waitFor(() => expect(screen).toHavePathname('/notifications'));
    await act(async () => router.back());
    expect(screen).toHavePathname(`/${other.name}`);
  });
});

// Tabs of each bar, written by hand so a mistake copying the config also fails (SC-004).
const BAR: Record<Role, number> = { STUDENT: 5, TEACHER: 4, SUPERADMIN: 5 };

describe.each(ROLES)('screens without a tab of %s', (role) => {
  const { tabs, hidden } = ROLE_TABS[role];

  it.each(hidden.map(({ name }) => name))('%s opens, and back returns to the first tab', async (name) => {
    await open(role);
    await go(name === 'changes' ? '/(admin)/changes' : `/${name}`); // the dashboard pushes '/(admin)/changes'
    expect(screen.queryByText(`screen:${name}`)).toBeTruthy();
    await act(async () => router.back());
    expect(screen).toHavePathname('/');
  });

  // Queries skip what is hidden (`display: 'none'` on the tab item), so counting the labelled tabs also
  // proves the hidden screens are not in the bar; do not add `includeHiddenElements` here.
  it('shows only its tabs, each announced with its position among them', async () => {
    await open(role);
    expect(screen.getAllByLabelText(/, pestaña \d+ de \d+$/)).toHaveLength(BAR[role]);
    expect(tabs).toHaveLength(BAR[role]);
    tabs.forEach(({ titleKey }, i) => {
      const title = i18n.t(titleKey);
      expect(screen.getByLabelText(`${title}, pestaña ${i + 1} de ${BAR[role]}`)).toBeTruthy();
    });
    for (const { titleKey } of hidden) expect(screen.queryByLabelText(new RegExp(`^${i18n.t(titleKey)}, `))).toBeNull();
  });

  it('never opens its inbox without a session or with the password change pending', async () => {
    useSession.setState({ status: 'signedOut', accessToken: null, user: null } as never);
    await renderRouter(routes(role), { initialUrl: `/${group(role)}/notifications` });
    expect(await screen.findByText('screen:login')).toBeTruthy();
    expect(screen.queryByText('screen:notifications')).toBeNull();

    signIn(role, true);
    await renderRouter(routes(role), { initialUrl: `/${group(role)}/notifications` });
    expect(await screen.findByText('screen:change-password')).toBeTruthy();
    expect(screen.queryByText('screen:notifications')).toBeNull();
  });

  it('declares every route of its group, as a tab or as a screen without a tab', () => {
    const dir = path.resolve(__dirname, '../../../../app', group(role));
    const declared = new Set([...tabs, ...hidden].map(({ name }) => name));
    const routesOfGroup = fs.readdirSync(dir).map((file) => file.replace(/\.tsx$/, '')).filter((name) => name !== '_layout');
    expect(routesOfGroup.filter((name) => !declared.has(name))).toEqual([]);
  });
});
