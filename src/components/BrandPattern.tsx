import { memo } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { Icon } from '@/icons/Icon';
import { motion, onGradient, usePalette } from '@/theme';
import {
  brandPatternLayouts,
  type PatternVariant,
} from './brandPatternLayouts';

const DARK_OPACITY = 0.06;

interface BrandPatternProps {
  variant: PatternVariant;
}

// Decorative leaves, feathers and books (docs/Design.md, "Brand pattern").
// Static, deterministic, ignores touches and is hidden from screen readers.
function BrandPatternBase({ variant }: BrandPatternProps) {
  const palette = usePalette();
  const dark = useColorScheme() === 'dark';
  const reduced = useReducedMotion();

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      entering={reduced ? undefined : FadeIn.duration(motion.duration.sheet)}
      style={StyleSheet.absoluteFill}
    >
      {brandPatternLayouts[variant].map((p, index) => (
        <View
          key={index}
          style={[
            styles.item,
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              opacity: dark ? DARK_OPACITY : p.opacity,
              transform: [{ rotate: `${p.rotation}deg` }],
            },
          ]}
        >
          <Icon
            name={p.icon}
            size={p.size}
            color={
              dark || p.tone === 'white' ? onGradient.text : palette.accent
            }
          />
        </View>
      ))}
    </Animated.View>
  );
}

export const BrandPattern = memo(BrandPatternBase);

const styles = StyleSheet.create({
  item: { position: 'absolute' },
});
