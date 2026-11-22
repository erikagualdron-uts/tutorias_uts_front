import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import type { PqrsStatus } from '@/api/types';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { radius, spacing, typography, usePalette } from '@/theme';

const ICONS: Record<PqrsStatus, IconName> = { FILED: 'pqrs', IN_REVIEW: 'clock', RESOLVED: 'success' };

// The state is always text plus icon, never color alone (docs/Design.md).
export function StatusBadge({ status }: { status: PqrsStatus }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const color = status === 'RESOLVED' ? palette.success : status === 'IN_REVIEW' ? palette.warning : palette.primary;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Icon name={ICONS[status]} size={16} color={color} />
      <Text style={[typography.label, { color: palette.textPrimary }]}>{t(`pqrs.status.${status}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
