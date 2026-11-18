import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { gradients, radius, shadows, spacing } from '@/theme';
import { BrandPattern } from './BrandPattern';

// Featured card: brand gradient with 3 pattern icons in the bottom-right corner.
// Not mounted on any screen yet (the next-module card arrives with the modules feature).
export function HeroCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient
      {...gradients.brand}
      colors={[...gradients.brand.colors]}
      style={[styles.card, shadows.level2, style]}
    >
      <BrandPattern variant="hero" />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.hero,
    padding: spacing.xl,
    overflow: 'hidden',
  },
});
