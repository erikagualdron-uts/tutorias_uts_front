import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  // One compact row that scrolls sideways (docs/Design.md, "Compact filter row"): 36 px visual, 48 px to touch.
  scroll?: boolean;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  scroll = false,
}: FilterChipsProps<T>) {
  const palette = usePalette();
  const chips = (
    <>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value ?? 'all'}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            hitSlop={scroll ? COMPACT_SLOP : undefined}
            style={[
              styles.chip,
              scroll && styles.compact,
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
    </>
  );
  return scroll ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips}
    </ScrollView>
  ) : (
    <View style={styles.row}>{chips}</View>
  );
}

const COMPACT_HEIGHT = 36;
const COMPACT_SLOP = { top: 6, bottom: 6 };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  compact: { minHeight: COMPACT_HEIGHT },
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  // Android clips the last glyph of short labels ("All" showed "Al") when the text box is measured with the
  // corporate font and letter spacing; margin sits outside that box, so the room is padding and the spacing is dropped.
  label: { flexShrink: 0, paddingHorizontal: spacing.xs, letterSpacing: 0 },
});
