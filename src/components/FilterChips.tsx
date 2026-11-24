import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  typography,
  usePalette,
} from '@/theme';

interface FilterChipsProps<T extends string> {
  // `value: undefined` is the "all" option.
  options: { value: T | undefined; label: string }[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  const palette = usePalette();
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value ?? 'all'}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? palette.primary : palette.card,
                borderColor: selected ? palette.primary : palette.controlBorder,
              },
            ]}
          >
            <Text
              style={[
                typography.label,
                styles.label,
                { color: selected ? palette.onPrimary : palette.textPrimary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  // Android clips the last glyph of short labels measured with the corporate font and letter spacing.
  label: { flexShrink: 0, marginRight: spacing.xs },
});
