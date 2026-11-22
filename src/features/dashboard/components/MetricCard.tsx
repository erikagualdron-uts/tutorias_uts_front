import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { MIN_TOUCH_TARGET, typography, usePalette } from '@/theme';
import { useCountUp } from '../hooks/useCountUp';

interface MetricCardProps {
  value: number | string;
  label: string;
  onPress?: () => void;
}

// Two per row on the Screen background: the number on top, the label under it (docs/Design.md).
// The number counts up once; the screen reader always gets the final value, never the steps.
export function MetricCard({ value, label, onPress }: MetricCardProps) {
  const palette = usePalette();
  const shown = useCountUp(value);
  const spoken = `${value} ${label}`;
  const card = (
    <Card>
      <Text style={[typography.metricNumber, { color: palette.textPrimary }]}>{shown}</Text>
      <Text style={[typography.metadata, { color: palette.textSecondary }]}>{label}</Text>
    </Card>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={spoken} onPress={onPress} style={styles.cell}>
      {card}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={spoken} style={styles.cell}>
      {card}
    </View>
  );
}

const styles = StyleSheet.create({ cell: { flex: 1, minHeight: MIN_TOUCH_TARGET } });
