import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { motion } from '@/theme';

interface LoaderRingProps {
  size: 'regular' | 'compact';
  color: string;
  // false = reduce motion: the ring stays still and its arc pulses instead of turning.
  animated: boolean;
}

// The ring around the loader icon (docs/Design.md, Loader): a faint track plus a quarter-circle
// arc that turns once per second. It is feedback, not decoration (D-080).
export function LoaderRing({ size, color, animated }: LoaderRingProps) {
  const { sweepDegrees, turn, pulse, pulseMin, trackOpacity } =
    motion.loader.ring;
  const { size: box, stroke } = motion.loader.ring[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = (circumference * sweepDegrees) / 360;

  const angle = useSharedValue(0);
  const glow = useSharedValue(1);
  useEffect(() => {
    if (animated) {
      angle.value = 0;
      angle.value = withRepeat(
        withTiming(360, { duration: turn, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      glow.value = pulseMin;
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: pulse / 2 }),
          withTiming(pulseMin, { duration: pulse / 2 }),
        ),
        -1,
        false,
      );
    }
    return () => {
      cancelAnimation(angle);
      cancelAnimation(glow);
    };
  }, [animated, angle, glow, turn, pulse, pulseMin]);

  // Only the arc moves; the track never does.
  const arcStyle = useAnimatedStyle(() => ({
    opacity: animated ? 1 : glow.value,
    transform: [{ rotate: `${animated ? angle.value : 0}deg` }],
  }));

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      pointerEvents="none"
      style={{ width: box, height: box }}
    >
      <Svg width={box} height={box} style={StyleSheet.absoluteFill}>
        <Circle
          testID="loader-ring-track"
          cx={box / 2}
          cy={box / 2}
          r={radius}
          stroke={color}
          strokeOpacity={trackOpacity}
          strokeWidth={stroke}
          fill="none"
        />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, arcStyle]}>
        <Svg width={box} height={box}>
          <Circle
            testID="loader-ring-arc"
            cx={box / 2}
            cy={box / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference - arc}`}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
