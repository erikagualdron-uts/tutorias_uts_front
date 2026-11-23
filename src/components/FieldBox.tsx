import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import {
  MIN_TOUCH_TARGET,
  motion,
  radius,
  spacing,
  typography,
  usePalette,
  type Palette,
} from '@/theme';

export const FIELD_HEIGHT = 52;

export interface FieldVisualState {
  focused: boolean;
  error: boolean;
  disabled: boolean;
  onCard: boolean;
}

// Visual rules of docs/Design.md, "Inputs". The error always wins over the focus.
export function fieldVisual(state: FieldVisualState, palette: Palette) {
  const { focused, error, disabled, onCard } = state;
  const base = onCard ? palette.inputFill : palette.inputFillOnScreen;
  if (error) {
    return {
      borderColor: palette.error,
      borderWidth: 1,
      backgroundColor: base,
      glow: palette.errorGlow,
      showGlow: !disabled,
      labelColor: palette.textPrimary,
      opacity: disabled ? 0.6 : 1,
    };
  }
  if (focused && !disabled) {
    return {
      borderColor: palette.inputBorderFocus,
      borderWidth: 2,
      backgroundColor: palette.card,
      glow: palette.focusGlow,
      showGlow: true,
      labelColor: palette.inputLabelFocus,
      opacity: 1,
    };
  }
  return {
    borderColor: palette.inputBorder,
    borderWidth: 1,
    backgroundColor: base,
    glow: palette.focusGlow,
    showGlow: false,
    labelColor: palette.textPrimary,
    opacity: disabled ? 0.6 : 1,
  };
}

interface FieldBoxProps extends FieldVisualState {
  label: string;
  errorMessage?: string;
  leadingIcon: IconName;
  trailing?: ReactNode;
  // Extra content under the box, inside the field (for example a counter).
  footer?: ReactNode;
  alignTop?: boolean;
  children: ReactNode;
}

// Shared box of every field: label, fill, soft border, leading icon, states and error line.
export function FieldBox({
  label,
  errorMessage,
  leadingIcon,
  trailing,
  footer,
  alignTop = false,
  children,
  ...state
}: FieldBoxProps) {
  const palette = usePalette();
  const reduced = useReducedMotion();
  const visual = fieldVisual(state, palette);
  const duration = reduced ? 0 : motion.duration.press;

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(visual.borderColor, { duration }),
    borderWidth: withTiming(visual.borderWidth, { duration }),
    backgroundColor: withTiming(visual.backgroundColor, { duration }),
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visual.showGlow ? 1 : 0, { duration }),
  }));

  return (
    <View style={{ opacity: visual.opacity }}>
      <Text style={[typography.label, { color: visual.labelColor }]}>
        {label}
      </Text>
      <View style={styles.wrap}>
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, { backgroundColor: visual.glow }, glowStyle]}
        />
        <Animated.View style={[styles.box, alignTop && styles.top, boxStyle]}>
          <View style={[styles.leading, alignTop && styles.leadingTop]}>
            <Icon name={leadingIcon} size={20} color={palette.textSecondary} />
          </View>
          {children}
          {trailing}
        </Animated.View>
      </View>
      {footer}
      {errorMessage ? (
        <View style={styles.errorRow}>
          <Icon name="error" size={16} color={palette.errorText} />
          <Text
            accessibilityLiveRegion="polite"
            style={[typography.metadata, { color: palette.errorText }]}
          >
            {errorMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  glow: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: radius.input + 4,
  },
  box: {
    minHeight: FIELD_HEIGHT,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  top: { alignItems: 'flex-start' },
  leading: {
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  leadingTop: { paddingTop: 2 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
