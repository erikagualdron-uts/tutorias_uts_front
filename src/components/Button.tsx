import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  typography,
  usePalette,
} from '@/theme';

type Variant = 'primary' | 'outlined' | 'tonal';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  // The rule that blocks the action; a disabled button always explains why (docs/Design.md).
  helperText?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  helperText,
}: ButtonProps) {
  const palette = usePalette();
  const inactive = disabled || loading;

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
  }[variant];

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
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
        {/* The spinner replaces the label inside the same box so the width does not change. */}
        <Text
          style={[
            typography.button,
            { color: disabled ? palette.disabledText : colors.text },
            loading && styles.hidden,
          ]}
        >
          {label}
        </Text>
        {loading && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.spinner}>
              <ActivityIndicator color={colors.text} />
            </View>
          </View>
        )}
      </Pressable>
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

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: { opacity: 0 },
  spinner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  helper: { marginTop: spacing.sm, textAlign: 'center' },
});
