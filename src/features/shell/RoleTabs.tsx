import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { AppBar } from '@/components/AppBar';
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

// Bottom tab bar of docs/Design.md (64 px, 1 px top border) for one role.
export function RoleTabs({ role, tabs }: { role: Role; tabs: TabSpec[] }) {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <RouteGate expected={ROLE_HOME[role]}>
      <Tabs
        screenOptions={{
          header: ({ options }) => <AppBar title={options.title} />,
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textSecondary,
          tabBarStyle: {
            height: 64,
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
      </Tabs>
    </RouteGate>
  );
}
