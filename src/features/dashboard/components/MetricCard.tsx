import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { MIN_TOUCH_TARGET, typography, usePalette } from '@/theme';

interface MetricCardProps {
  value: number | string;
  label: string;
  onPress?: () => void;
}

// Two per row on the Screen background: the number on top, the label under it (docs/Design.md).
export function MetricCard({ value, label, onPress }: MetricCardProps) {
  const palette = usePalette();
  const card = (
    <Card>
      <Text style={[typography.metricNumber, { color: palette.textPrimary }]}>{value}</Text>
      <Text style={[typography.metadata, { color: palette.textSecondary }]}>{label}</Text>
    </Card>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={`${value} ${label}`} onPress={onPress} style={styles.cell}>
      {card}
    </Pressable>
  ) : (
    <View style={styles.cell}>{card}</View>
  );
}

const styles = StyleSheet.create({ cell: { flex: 1, minHeight: MIN_TOUCH_TARGET } });
