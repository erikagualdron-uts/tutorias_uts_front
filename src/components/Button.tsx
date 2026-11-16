import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import {
  MIN_TOUCH_TARGET,
  buttonHeight,
  motion,
  radius,
  spacing,
  typography,
  usePalette,
} from '@/theme';
import { useMotion } from './useMotion';

type Variant = 'primary' | 'outlined' | 'tonal' | 'link';

interface ButtonProps {
  label: string;
  // Leading icon; links are the only buttons without one.
  icon?: IconName;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  // The rule that blocks the action; a disabled button always explains why (docs/Design.md).
  helperText?: string;
}

function usePressScale(target: number) {
  const { movement } = useMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const to = (pressed: boolean) => {
    if (movement)
      scale.set(
        withTiming(pressed ? target : 1, { duration: motion.duration.press }),
      );
  };
  return { style, onPressIn: () => to(true), onPressOut: () => to(false) };
}

export function Button({
  label,
  icon,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  helperText,
}: ButtonProps) {
  const palette = usePalette();
  const press = usePressScale(motion.pressScale.button);
  const inactive = disabled || loading;
  const isLink = variant === 'link';

  const colors = {
    primary: {
      bg: palette.primary,
      pressed: palette.primaryPressed,
      text: palette.onPrimary,
      border: palette.primary,
    },
    outlined: {
      bg: 'transparent',
      pressed: palette.surface,
      text: palette.textPrimary,
      border: palette.border,
    },
    tonal: {
      bg: palette.surface,
      pressed: palette.border,
      text: palette.textPrimary,
      border: palette.surface,
    },
    link: {
      bg: 'transparent',
      pressed: 'transparent',
      text: palette.link,
      border: 'transparent',
    },
  }[variant];
  const textColor = disabled ? palette.disabledText : colors.text;

  return (
    <View>
      <Animated.View style={press.style}>
        <Pressable
          accessibilityRole={isLink ? 'link' : 'button'}
          accessibilityLabel={label}
          accessibilityState={{ disabled: inactive, busy: loading }}
          disabled={inactive}
          onPress={onPress}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          style={({ pressed }) => [
            styles.base,
            isLink && styles.link,
            {
              backgroundColor: disabled
                ? palette.surface
                : pressed
                  ? colors.pressed
                  : colors.bg,
              borderColor: disabled ? palette.surface : colors.border,
            },
          ]}
        >
          {/* The spinner replaces the content inside the same box so the width does not change. */}
          <View style={[styles.content, loading && styles.hidden]}>
            {icon && !isLink && <Icon name={icon} color={textColor} />}
            <Text style={[typography.button, { color: textColor }]}>
              {label}
            </Text>
          </View>
          {loading && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.spinner}>
                <ActivityIndicator color={colors.text} />
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>
      {disabled && helperText ? (
        <Text
          style={[
            typography.metadata,
            styles.helper,
            { color: palette.textSecondary },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

interface IconButtonProps {
  icon: IconName;
  // Icon-only controls must be labelled for screen readers.
  label: string;
  onPress: () => void;
  color?: string;
}

export function IconButton({ icon, label, onPress, color }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.iconButton}
    >
      <Icon name={icon} size={24} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: buttonHeight.default,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { minHeight: MIN_TOUCH_TARGET, borderWidth: 0 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hidden: { opacity: 0 },
  spinner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  helper: { marginTop: spacing.sm, textAlign: 'center' },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
