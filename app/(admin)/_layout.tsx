import { useFiledCount } from '@/features/pqrs/hooks/useFiledCount';
import { RoleTabs } from '@/features/shell/RoleTabs';
import { ROLE_TABS } from '@/features/shell/roleTabs.config';

export default function Layout() {
  const filed = useFiledCount();
  const { tabs, hidden } = ROLE_TABS.SUPERADMIN;
  // The count of filed PQRS is live data, so it is added to the tab here and not in the config.
  return <RoleTabs role="SUPERADMIN" tabs={tabs.map((tab) => (tab.name === 'pqrs' ? { ...tab, badge: filed } : tab))} hidden={hidden} />;
}
