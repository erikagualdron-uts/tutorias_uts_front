import { RoleTabs } from '@/features/shell/RoleTabs';

export default function Layout() {
  return (
    <RoleTabs
      role="STUDENT"
      tabs={[
        { name: 'index', titleKey: 'tabs.home', icon: 'home-outline' },
        { name: 'modules', titleKey: 'tabs.modules', icon: 'book-outline' },
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
