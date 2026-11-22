import { StyleSheet, Text, View } from 'react-native';
import type { PqrsStatus } from '@/api/types';
import { StatusBadge } from '@/features/pqrs/components/StatusBadge';
import { radius, spacing, typography, usePalette } from '@/theme';

const ORDER: PqrsStatus[] = ['FILED', 'IN_REVIEW', 'RESOLVED'];

// One stacked bar with the PQRS of each state; the legend writes every state and its number,
// so the colors (neutral, orange, green) never carry the meaning alone.
export function StatusStackBar({ counts }: { counts: Record<PqrsStatus, number> }) {
  const palette = usePalette();
  const colors: Record<PqrsStatus, string> = { FILED: palette.textSecondary, IN_REVIEW: palette.warning, RESOLVED: palette.success };
  return (
    <View style={styles.box}>
      <View style={[styles.bar, { backgroundColor: palette.surface }]}>
        {ORDER.filter((status) => counts[status] > 0).map((status) => (
          <View key={status} testID={`segment-${status}`} style={{ flex: counts[status], backgroundColor: colors[status] }} />
        ))}
      </View>
      <View style={styles.legend}>
        {ORDER.map((status) => (
          <View key={status} style={styles.item}>
            <StatusBadge status={status} />
            <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{counts[status]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.md },
  bar: { flexDirection: 'row', height: 14, borderRadius: radius.pill, overflow: 'hidden' },
  legend: { gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
