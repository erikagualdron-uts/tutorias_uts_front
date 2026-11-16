import { RoleTabs } from '@/features/shell/RoleTabs';

export default function Layout() {
  return (
    <RoleTabs
      role="TEACHER"
      tabs={[
        { name: 'index', titleKey: 'tabs.dashboard', icon: 'grid-outline' },
        {
          name: 'schedule',
          titleKey: 'tabs.schedule',
          icon: 'calendar-outline',
        },
        {
          name: 'messages',
          titleKey: 'tabs.messages',
          icon: 'chatbubbles-outline',
        },
        { name: 'pqrs', titleKey: 'tabs.pqrs', icon: 'document-text-outline' },
      ]}
    />
  );
}
