import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, usePalette } from '@/theme';

interface CapacityBarProps {
  label: string;
  value: number;
  max: number;
  // Shown on the right instead of `value/max`.
  valueText?: string;
  large?: boolean;
}

// Colors of docs/Design.md: under 80 % green, 80 to 99 % orange, full gray. The numbers are always written.
export function CapacityBar({ label, value, max, valueText, large = false }: CapacityBarProps) {
  const palette = usePalette();
  const percent = max <= 0 ? 0 : Math.min(100, (value / max) * 100);
  const color = percent >= 100 ? palette.textSecondary : percent >= 80 ? palette.warning : palette.primary;
  const text = valueText ?? `${value}/${max}`;
  return (
    <View style={styles.box} accessible accessibilityLabel={`${label} ${text}`}>
      <View style={styles.row}>
        <Text style={[typography.bodySmall, styles.label, { color: palette.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[typography.bodySmall, { color: palette.textPrimary }]}>{text}</Text>
      </View>
      <View style={[styles.track, large && styles.large, { backgroundColor: palette.surface }]}>
        <View testID="capacity-fill" style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  label: { flex: 1 },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  large: { height: 14 },
  fill: { height: '100%', borderRadius: radius.pill },
});
