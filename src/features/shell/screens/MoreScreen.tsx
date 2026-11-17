import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';

const CONFIGURATION_ROWS: { label: string; icon: IconName; href: Href }[] = [
  { label: 'more.periods', icon: 'dateRange', href: '/more/periods' },
  { label: 'more.holidays', icon: 'holiday', href: '/more/holidays' },
  { label: 'more.dropdownLists', icon: 'list', href: '/more/dropdown-lists' },
];

// Entry points of the CAE "More" tab; Students arrive with their feature.
export function MoreScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <Button
        label={t('more.createTeacher')}
        icon="userAdd"
        variant="tonal"
        onPress={() => router.push('/more/create-teacher')}
      />
      <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>
        {t('more.configuration')}
      </Text>
      <Card style={styles.group}>
        {CONFIGURATION_ROWS.map((row) => (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            accessibilityLabel={t(row.label)}
            onPress={() => router.push(row.href)}
            style={styles.row}
          >
            <Icon name={row.icon} />
            <Text
              style={[
                typography.body,
                styles.rowLabel,
                { color: palette.textPrimary },
              ]}
            >
              {t(row.label)}
            </Text>
            <Icon name="chevronRight" color={palette.textSecondary} />
          </Pressable>
        ))}
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  group: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
  },
  rowLabel: { flex: 1 },
});
