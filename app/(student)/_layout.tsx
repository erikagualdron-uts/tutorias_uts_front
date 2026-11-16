import { RoleTabs } from '@/features/shell/RoleTabs';

export default function Layout() {
  return (
    <RoleTabs
      role="STUDENT"
      tabs={[
        { name: 'index', titleKey: 'tabs.home', icon: 'home' },
        { name: 'modules', titleKey: 'tabs.modules', icon: 'modules' },
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
