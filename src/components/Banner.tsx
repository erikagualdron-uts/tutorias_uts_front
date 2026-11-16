import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, usePalette } from '@/theme';

interface BannerProps {
  message: string;
  icon?: ReactNode;
}

// Notices and the rule that blocks an action (docs/Design.md: cream fill, deep green text).
export function Banner({ message, icon }: BannerProps) {
  const palette = usePalette();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.box, { backgroundColor: palette.surfaceWarm }]}
    >
      {icon}
      <Text style={[typography.body, styles.text, { color: palette.onAccent }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.banner,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: { flex: 1 },
});
