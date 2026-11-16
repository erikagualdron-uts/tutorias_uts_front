import { RoleTabs } from '@/features/shell/RoleTabs';

export default function Layout() {
  return (
    <RoleTabs
      role="TEACHER"
      tabs={[
        { name: 'index', titleKey: 'tabs.dashboard', icon: 'home' },
        {
          name: 'schedule',
          titleKey: 'tabs.schedule',
          icon: 'schedule',
        },
        {
          name: 'messages',
          titleKey: 'tabs.messages',
          icon: 'messages',
        },
        { name: 'pqrs', titleKey: 'tabs.pqrs', icon: 'pqrs' },
      ]}
    />
  );
}
