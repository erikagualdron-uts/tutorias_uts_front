import { useEffect } from 'react';
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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { motion, spacing, typography, usePalette } from '@/theme';
import { iconOpacity } from './brandLoaderTiming';
import { useLoaderPhase } from './useLoaderPhase';
import { useMotion } from './useMotion';

const SEQUENCE: IconName[] = ['openBook', 'feather', 'leaf'];
const SIZE = { regular: 48, compact: 20 } as const;

interface BrandLoaderProps {
  // regular: screens and content areas (waits 300 ms, adds a message after 1000 ms).
  // compact: buttons and inline rows (immediate, no message).
  size?: keyof typeof SIZE;
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
  const style = useAnimatedStyle(() => ({
    opacity: iconOpacity(t.value, index, animated),
  }));
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
// book → feather → leaf, 900 ms each.
export function BrandLoader({ size = 'regular', color }: BrandLoaderProps) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const dark = useColorScheme() === 'dark';
  const { movement } = useMotion();
  const phase = useLoaderPhase(size === 'regular');
  const px = SIZE[size];
  const tone = color ?? (dark ? palette.textPrimary : palette.primary);

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

  return (
    <View
      // Exposed to screen readers only while it is visible, so a load shorter than 300 ms
      // is never announced.
      accessible={visible}
      accessibilityRole={visible ? 'progressbar' : undefined}
      accessibilityLabel={visible ? t('common.loading') : undefined}
      accessibilityState={visible ? { busy: true } : undefined}
      style={styles.box}
    >
      <View style={{ width: px, height: px }}>
        {visible &&
          SEQUENCE.map((name, index) => (
            <LoaderIcon
              key={name}
              name={name}
              index={index}
              t={clock}
              animated={movement}
              color={tone}
              size={px}
            />
          ))}
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
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.md },
  layer: { alignItems: 'center', justifyContent: 'center' },
  message: { textAlign: 'center' },
});
