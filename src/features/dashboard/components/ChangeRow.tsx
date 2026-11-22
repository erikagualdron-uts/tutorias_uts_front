import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { relativeTime } from '../format';
import type { RecentChange } from '../types';

// A cancellation or reschedule: icon, module and "Cancelada · hace 5 min" (the kind is written, not just an icon).
export function ChangeRow({ change, onPress }: { change: RecentChange; onPress?: () => void }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const kind = t(`dashboard.admin.changes.${change.kind}`);
  const row = (
    <View style={styles.row}>
      <Icon name={change.kind === 'CANCELLED' ? 'closeCircle' : 'clock'} size={24} color={palette.textSecondary} />
      <View style={styles.text}>
        <Text style={[typography.cardTitle, { color: palette.textPrimary }]} numberOfLines={1}>
          {change.moduleName}
        </Text>
        <Text style={[typography.metadata, { color: palette.textSecondary }]}>{`${kind} · ${relativeTime(t, change.changedAt)}`}</Text>
      </View>
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={`${change.moduleName}, ${kind}`} onPress={onPress}>
      {row}
    </Pressable>
  ) : (
    row
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  text: { flex: 1 },
});
