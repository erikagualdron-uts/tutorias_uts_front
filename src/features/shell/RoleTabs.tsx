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
import { iconSize, shadows, usePalette } from '@/theme';

export interface TabSpec {
  // Route file name inside the role group ('index' for the first tab).
  name: string;
  titleKey: string;
  icon: IconName;
}

// Bottom tab bar of docs/Design.md (64 px plus the bottom safe area, so it clears system buttons) for one role.
export function RoleTabs({ role, tabs, hidden = [] }: { role: Role; tabs: TabSpec[]; hidden?: Pick<TabSpec, 'name' | 'titleKey'>[] }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { bottom } = useSafeAreaInsets();
  useChatSocket();

  return (
    <RouteGate expected={ROLE_HOME[role]}>
      <PushRegistration />
      <Tabs
        screenOptions={{
          header: ({ options }) => <AppBar title={options.title} />,
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textSecondary,
          tabBarStyle: {
            height: 64 + bottom,
            paddingBottom: bottom,
            backgroundColor: palette.card,
            borderTopWidth: 0,
            ...shadows.level1,
          },
        }}
      >
        {tabs.map(({ name, titleKey, icon }) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: t(titleKey),
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
        {/* Screens reached from a link, not from a tab (the inbox from the bell of the app bar). */}
        {hidden.map(({ name, titleKey }) => (
          <Tabs.Screen key={name} name={name} options={{ href: null, title: t(titleKey) }} />
        ))}
        <Tabs.Screen
          name="notifications"
          options={{ href: null, title: t('notifications.title') }}
        />
      </Tabs>
    </RouteGate>
  );
}
