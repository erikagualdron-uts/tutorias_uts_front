import type { Role } from '@/api/types';
import type { TabSpec } from './RoleTabs';

type HiddenSpec = Pick<TabSpec, 'name' | 'titleKey'>;

const INBOX: HiddenSpec = { name: 'notifications', titleKey: 'notifications.title' };
// "My account" and its voluntary password change, reached from the avatar menu.
const ACCOUNT: HiddenSpec[] = [
  { name: 'account', titleKey: 'account.title' },
  { name: 'account-password', titleKey: 'account.password.title' },
];

// The one declaration of the tab bar of each role: the tabs, and the screens that have no tab and are
// reached from a link (the inbox from the bell, the changes list from the CAE dashboard). The layouts
// of app/ and hiddenScreens.test.tsx read it, so a new screen is covered without editing the test.
export const ROLE_TABS: Record<Role, { tabs: TabSpec[]; hidden: HiddenSpec[] }> = {
  STUDENT: {
    tabs: [
      { name: 'index', titleKey: 'tabs.home', icon: 'home' },
      { name: 'modules', titleKey: 'tabs.modules', icon: 'modules' },
      { name: 'schedule', titleKey: 'tabs.schedule', icon: 'schedule' },
      { name: 'messages', titleKey: 'tabs.messages', icon: 'messages' },
      { name: 'pqrs', titleKey: 'tabs.pqrs', icon: 'pqrs' },
    ],
    hidden: [INBOX, ...ACCOUNT],
  },
  TEACHER: {
    tabs: [
      { name: 'index', titleKey: 'tabs.dashboard', icon: 'home' },
      { name: 'schedule', titleKey: 'tabs.schedule', icon: 'schedule' },
      { name: 'messages', titleKey: 'tabs.messages', icon: 'messages' },
      { name: 'pqrs', titleKey: 'tabs.pqrs', icon: 'pqrs' },
    ],
    hidden: [INBOX, ...ACCOUNT],
  },
  SUPERADMIN: {
    tabs: [
      { name: 'index', titleKey: 'tabs.dashboard', icon: 'home' },
      { name: 'modules', titleKey: 'tabs.modules', icon: 'modules' },
      { name: 'messages', titleKey: 'tabs.messages', icon: 'messages' },
      { name: 'pqrs', titleKey: 'tabs.pqrs', icon: 'pqrs' },
      { name: 'more', titleKey: 'tabs.more', icon: 'more' },
    ],
    hidden: [
      INBOX,
      { name: 'changes', titleKey: 'dashboard.admin.changes.title' },
      ...ACCOUNT,
    ],
  },
};
