import { RoleTabs } from '@/features/shell/RoleTabs';

export default function Layout() {
  return (
    <RoleTabs
      role="SUPERADMIN"
      tabs={[
        { name: 'index', titleKey: 'tabs.dashboard', icon: 'grid-outline' },
        { name: 'modules', titleKey: 'tabs.modules', icon: 'book-outline' },
        {
          name: 'messages',
          titleKey: 'tabs.messages',
          icon: 'chatbubbles-outline',
        },
        { name: 'pqrs', titleKey: 'tabs.pqrs', icon: 'document-text-outline' },
        { name: 'more', titleKey: 'tabs.more', icon: 'ellipsis-horizontal' },
      ]}
    />
  );
}
