import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { typography, usePalette } from '@/theme';
import { FIELD_HEIGHT, FieldBox } from './FieldBox';

interface SelectFieldProps {
  label: string;
  leadingIcon: IconName;
  // Text of the chosen option; the placeholder shows when empty.
  value?: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onCard?: boolean;
  // The screen opens its own list (sheet or dialog) when the field is pressed.
  onPress: () => void;
}

export function SelectField({
  label,
  leadingIcon,
  value,
  placeholder,
  error,
  disabled = false,
  onCard = true,
  onPress,
}: SelectFieldProps) {
  const palette = usePalette();
  const [focused, setFocused] = useState(false);

  return (
    <FieldBox
      label={label}
      errorMessage={error}
      leadingIcon={leadingIcon}
      focused={focused}
      error={Boolean(error)}
      disabled={disabled}
      onCard={onCard}
      trailing={<Icon name="chevronDown" color={palette.textSecondary} />}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={value ? { text: value } : undefined}
        accessibilityHint={error}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => setFocused(true)}
        onPressOut={() => setFocused(false)}
        style={styles.press}
      >
        <Text
          numberOfLines={1}
          style={[
            typography.body,
            { color: value ? palette.textPrimary : palette.inputPlaceholder },
          ]}
        >
          {value || placeholder}
        </Text>
      </Pressable>
    </FieldBox>
  );
}

const styles = StyleSheet.create({
  press: { flex: 1, minHeight: FIELD_HEIGHT, justifyContent: 'center' },
});
