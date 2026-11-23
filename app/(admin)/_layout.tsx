import { useFiledCount } from '@/features/pqrs/hooks/useFiledCount';
import { RoleTabs } from '@/features/shell/RoleTabs';

export default function Layout() {
  const filed = useFiledCount();
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
        { name: 'pqrs', titleKey: 'tabs.pqrs', icon: 'pqrs', badge: filed },
        { name: 'more', titleKey: 'tabs.more', icon: 'more' },
      ]}
      hidden={[{ name: 'changes', titleKey: 'dashboard.admin.changes.title' }]}
    />
  );
}
