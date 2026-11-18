import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { MIN_TOUCH_TARGET, radius, spacing, typography, usePalette } from '@/theme';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string; icon: IconName }[];
  value: T;
  onChange: (value: T) => void;
  // Names the group for screen readers.
  label: string;
}

// A few exclusive options side by side; each one has its icon on the left and its text, never color alone.
export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  const palette = usePalette();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={[styles.row, { backgroundColor: palette.surface }]}>
      {options.map((option) => {
        const selected = option.value === value;
        const color = selected ? palette.onPrimary : palette.textPrimary;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && { backgroundColor: palette.primary }]}
          >
            <Icon name={option.icon} size={16} color={color} />
            <Text style={[typography.label, { color }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: radius.pill, overflow: 'hidden' },
  option: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
});
