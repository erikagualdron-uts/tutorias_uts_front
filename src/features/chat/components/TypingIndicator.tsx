import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useMotion } from '@/components/useMotion';
import { radius, useShadows, spacing, typography, usePalette } from '@/theme';

// Each dot breathes at its own pace, so the three never move together.
const DOT_MS = [380, 480, 580];

function Dot({ period, color }: { period: number; color: string }) {
  const { movement } = useMotion();
  const level = useSharedValue(1);
  useEffect(() => {
    if (movement) level.set(withRepeat(withSequence(withTiming(0.3, { duration: period }), withTiming(1, { duration: period })), -1));
  }, [movement, level, period]);
  const style = useAnimatedStyle(() => ({ opacity: level.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

// Three dots in a received-style bubble, and always the words: with "reduce motion" the dots stand still and the
// text still says it (docs/Design.md, Typing indicator). Announced politely to a screen reader.
export function TypingIndicator() {
  const { t } = useTranslation();
  const palette = usePalette();
  const shadows = useShadows();
  return (
    <View style={styles.row} accessible accessibilityLiveRegion="polite" accessibilityLabel={t('chat.typing')}>
      <View style={[styles.bubble, shadows.level1, { backgroundColor: palette.card }]}>
        {DOT_MS.map((period) => (
          <Dot key={period} period={period} color={palette.textSecondary} />
        ))}
      </View>
      <Text style={[typography.metadata, { color: palette.textSecondary }]}>{t('chat.typing')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.card, borderTopLeftRadius: radius.tooltip, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  dot: { width: 8, height: 8, borderRadius: radius.badge },
});
