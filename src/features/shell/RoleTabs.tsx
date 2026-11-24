import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { AppBar } from '@/components/AppBar';
import { useChatSocket } from '@/features/chat/hooks/useChatSocket';
import { PushRegistration } from '@/features/notifications/components/PushRegistration';
import { RouteGate } from '@/features/auth/RouteGate';
import { ROLE_HOME } from '@/features/auth/routing';
import type { Role } from '@/api/types';
import { iconSize, useShadows, usePalette } from '@/theme';
import { tabBadgeOptions } from './badge';

export interface TabSpec {
  // Route file name inside the role group ('index' for the first tab).
  name: string;
  titleKey: string;
  icon: IconName;
  // A count for the badge of the tab; none or 0 shows no badge.
  badge?: number;
}

// Bottom tab bar of docs/Design.md (64 px plus the bottom safe area, so it clears system buttons) for one role.
// `href: null` would hide a screen but Expo Router 58 then refuses to navigate to it (the bell and the
// changes link landed on the home screen), so it is hidden by its tab button instead (spec 024).
const HIDDEN_TAB = { display: 'none' as const };

export function RoleTabs({ role, tabs, hidden }: { role: Role; tabs: TabSpec[]; hidden: Pick<TabSpec, 'name' | 'titleKey'>[] }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const shadows = useShadows();
  const { bottom } = useSafeAreaInsets();
  useChatSocket();

  return (
    <RouteGate expected={ROLE_HOME[role]}>
      <PushRegistration />
      <Tabs
        backBehavior="history"
        screenOptions={{
          header: ({ options }) => <AppBar title={options.title} />,
          tabBarActiveTintColor: palette.tabActive,
          tabBarInactiveTintColor: palette.tabInactive,
          tabBarStyle: {
            height: 64 + bottom,
            paddingBottom: bottom,
            backgroundColor: palette.card,
            borderTopWidth: 0,
            ...shadows.level1,
          },
        }}
      >
        {tabs.map(({ name, titleKey, icon, badge }, index) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: t(titleKey),
              // The bar would count the hidden screens too ("1 of 6" with 5 tabs).
              tabBarAccessibilityLabel: t('tabs.position', { title: t(titleKey), index: index + 1, count: tabs.length }),
              ...tabBadgeOptions(badge, palette),
              tabBarIcon: ({ color, focused }) => (
                <Icon
                  name={icon}
                  active={focused}
                  size={iconSize.nav}
                  color={String(color)}
                />
              ),
            }}
          />
        ))}
        {hidden.map(({ name, titleKey }) => (
          <Tabs.Screen key={name} name={name} options={{ title: t(titleKey), tabBarItemStyle: HIDDEN_TAB }} />
        ))}
      </Tabs>
    </RouteGate>
  );
}
