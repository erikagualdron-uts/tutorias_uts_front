import type { ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { motion } from '@/theme';
import { useMotion } from './useMotion';

// Entrance: fade plus an 8 px rise; fade only when motion is reduced.
export function FadeInView({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { movement } = useMotion();
  const base = movement ? FadeInDown : FadeIn;
  return (
    <Animated.View
      entering={base.duration(motion.duration.standard).delay(delay)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
