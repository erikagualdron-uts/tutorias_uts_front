import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { FIELD_HEIGHT, FieldBox } from './FieldBox';
import type { TextFieldProps } from './TextField';

interface SearchFieldProps extends Omit<
  TextFieldProps,
  'leadingIcon' | 'password'
> {
  onClear: () => void;
}

export function SearchField({
  label,
  error,
  onCard = true,
  onClear,
  ...inputProps
}: SearchFieldProps) {
  const palette = usePalette();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const hasText = Boolean(inputProps.value);

  return (
    <FieldBox
      label={label}
      errorMessage={error}
      leadingIcon="search"
      focused={focused}
      error={Boolean(error)}
      disabled={inputProps.editable === false}
      onCard={onCard}
      trailing={
        hasText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.clearSearch')}
            onPress={onClear}
            style={styles.clear}
          >
            <Icon name="closeCircle" color={palette.textSecondary} />
          </Pressable>
        ) : undefined
      }
    >
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        returnKeyType="search"
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        placeholderTextColor={palette.inputPlaceholder}
        style={[typography.body, styles.input, { color: palette.textPrimary }]}
      />
    </FieldBox>
  );
}

const styles = StyleSheet.create({
  input: { flex: 1, minHeight: FIELD_HEIGHT, paddingVertical: 0 },
  clear: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    marginRight: -spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
