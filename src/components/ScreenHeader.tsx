import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import {
  gradients,
  onGradient,
  radius,
  spacing,
  typography,
  useShadows,
  usePalette,
} from '@/theme';

// Compact brand header of the "sober with header" register (docs/Design.md): gradient, title, accent
// line and an optional count. No pattern: the header is the only block of color of its screen.
export function ScreenHeader({ title, count }: { title: string; count?: number }) {
  const palette = usePalette();
  const shadows = useShadows();
  return (
    <LinearGradient
      {...gradients.brand}
      colors={[...gradients.brand.colors]}
      style={[styles.box, shadows.level1]}
    >
      <View style={styles.title}>
        <Text accessibilityRole="header" style={[typography.screenTitle, styles.light]}>
          {title}
        </Text>
        <View style={[styles.line, { backgroundColor: palette.accent }]} />
      </View>
      {count === undefined ? null : (
        <Text style={[typography.metricNumber, styles.light]}>{count}</Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
  },
  title: { flex: 1, gap: spacing.xs, alignSelf: 'flex-start' },
  line: { height: 4, width: spacing.xxl, borderRadius: radius.line },
  light: { color: onGradient.text },
});
