import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { motion, spacing, typography, usePalette } from '@/theme';
import { iconMotion } from './brandLoaderTiming';
import { LoaderRing } from './LoaderRing';
import { useLoaderPhase } from './useLoaderPhase';
import { useMotion } from './useMotion';

const SEQUENCE: IconName[] = ['openBook', 'feather', 'leaf'];
const ICON = motion.loader.icon;

interface BrandLoaderProps {
  // regular: screens and content areas (waits 300 ms, adds a message after 1000 ms).
  // compact: buttons and inline rows (immediate, no message).
  size?: keyof typeof ICON;
  color?: string;
}

function LoaderIcon({
  name,
  index,
  t,
  animated,
  color,
  size,
}: {
  name: IconName;
  index: number;
  t: SharedValue<number>;
  animated: boolean;
  color: string;
  size: number;
}) {
  const style = useAnimatedStyle(() => {
    const m = iconMotion(t.value, index, animated);
    return { opacity: m.opacity, transform: [{ scale: m.scale }] };
  });
  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[StyleSheet.absoluteFill, styles.layer, style]}
    >
      <Icon name={name} size={size} color={color} />
    </Animated.View>
  );
}

// The app's loading indicator (docs/Design.md, Loader): one brand icon at a time,
// book → feather → leaf, inside a spinning ring; each icon grows in and shrinks out.
export function BrandLoader({ size = 'regular', color }: BrandLoaderProps) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const dark = useColorScheme() === 'dark';
  const { movement } = useMotion();
  const phase = useLoaderPhase(size === 'regular');
  const icon = ICON[size];
  const box = motion.loader.ring[size].size;
  const tone = color ?? (dark ? palette.textPrimary : palette.primary);

  const { entering, exiting } = useMemo(() => {
    const fade = motion.loader.fade;
    return { entering: FadeIn.duration(fade), exiting: FadeOut.duration(fade) };
  }, []);

  // One clock for the three icons keeps them in sync; it restarts from the book every time
  // the loader becomes visible.
  const clock = useSharedValue(0);
  const visible = phase !== 'hidden';
  useEffect(() => {
    if (!visible) return;
    clock.value = 0;
    clock.value = withRepeat(
      withTiming(3, {
        duration: motion.loader.iteration * SEQUENCE.length,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(clock);
  }, [visible, clock]);

  // The delay message is announced once, when it appears; the label never changes with the icon.
  useEffect(() => {
    if (phase === 'slow') {
      AccessibilityInfo.announceForAccessibility(i18n.t('common.loadingSlow'));
    }
  }, [phase, i18n]);

  // First 300 ms: nothing is painted, but the space stays reserved so nothing below jumps.
  if (!visible) return <View style={{ width: box, height: box }} />;

  return (
    // This is the view that enters and leaves: when a screen drops the loader, Reanimated
    // keeps playing the exit over the content, which does not wait for it.
    <Animated.View
      entering={entering}
      exiting={exiting}
      // Exposed to screen readers only while it is visible, so a load shorter than 300 ms
      // is never announced.
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.loading')}
      accessibilityState={{ busy: true }}
      style={styles.box}
    >
      <View style={[styles.ringBox, { width: box, height: box }]}>
        <View style={StyleSheet.absoluteFill}>
          <LoaderRing size={size} color={tone} animated={movement} />
        </View>
        <View style={{ width: icon, height: icon }}>
          {SEQUENCE.map((name, index) => (
            <LoaderIcon
              key={name}
              name={name}
              index={index}
              t={clock}
              animated={movement}
              color={tone}
              size={icon}
            />
          ))}
        </View>
      </View>
      {phase === 'slow' && (
        <Text
          style={[
            typography.body,
            styles.message,
            { color: palette.textSecondary },
          ]}
        >
          {t('common.loadingSlow')}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.md },
  ringBox: { alignItems: 'center', justifyContent: 'center' },
  layer: { alignItems: 'center', justifyContent: 'center' },
  message: { textAlign: 'center' },
});
