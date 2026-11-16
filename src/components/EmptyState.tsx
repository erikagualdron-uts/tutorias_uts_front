import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography, usePalette } from '@/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  const palette = usePalette();
  return (
    <View style={styles.box}>
      {icon}
      <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>
        {title}
      </Text>
      <Text
        style={[
          typography.body,
          styles.description,
          { color: palette.textSecondary },
        ]}
      >
        {description}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  description: { textAlign: 'center' },
});
