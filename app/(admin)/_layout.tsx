import { RoleTabs } from '@/features/shell/RoleTabs';

export default function Layout() {
  return (
    <RoleTabs
      role="SUPERADMIN"
      tabs={[
        { name: 'index', titleKey: 'tabs.dashboard', icon: 'home' },
        { name: 'modules', titleKey: 'tabs.modules', icon: 'modules' },
        {
          name: 'messages',
          titleKey: 'tabs.messages',
          icon: 'messages',
        },
        { name: 'pqrs', titleKey: 'tabs.pqrs', icon: 'pqrs' },
        { name: 'more', titleKey: 'tabs.more', icon: 'more' },
      ]}
    />
  );
}
