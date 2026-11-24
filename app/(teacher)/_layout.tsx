import { RoleTabs } from '@/features/shell/RoleTabs';
import { ROLE_TABS } from '@/features/shell/roleTabs.config';

export default function Layout() {
  return <RoleTabs role="TEACHER" {...ROLE_TABS.TEACHER} />;
}
