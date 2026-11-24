import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { spacing, typography, useInputProps, usePalette } from '@/theme';
import { FIELD_HEIGHT, FieldBox } from './FieldBox';
import type { TextFieldProps } from './TextField';

const MAX_LINES = 6;

interface TextAreaFieldProps extends Omit<TextFieldProps, 'password'> {
  maxLength?: number;
}

// Grows up to 6 lines; the counter sits under the text, bottom right.
export function TextAreaField({
  label,
  leadingIcon,
  error,
  onCard = true,
  maxLength,
  ...inputProps
}: TextAreaFieldProps) {
  const palette = usePalette();
  const inputTheme = useInputProps();
  const [focused, setFocused] = useState(false);
  const [height, setHeight] = useState(FIELD_HEIGHT);
  const maxHeight = typography.body.lineHeight * MAX_LINES + spacing.xl;
  const length = (inputProps.value ?? '').length;

  return (
    <FieldBox
      label={label}
      errorMessage={error}
      leadingIcon={leadingIcon}
      focused={focused}
      error={Boolean(error)}
      disabled={inputProps.editable === false}
      onCard={onCard}
      alignTop
      footer={
        maxLength ? (
          <Text
            style={[
              typography.metadata,
              styles.counter,
              { color: palette.textSecondary },
            ]}
          >
            {length}/{maxLength}
          </Text>
        ) : undefined
      }
    >
      <TextInput
        {...inputProps}
        multiline
        maxLength={maxLength}
        accessibilityLabel={label}
        accessibilityHint={error}
        onContentSizeChange={(event) =>
          setHeight(
            Math.min(
              maxHeight,
              Math.max(
                FIELD_HEIGHT,
                event.nativeEvent.contentSize.height + spacing.xl,
              ),
            ),
          )
        }
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        {...inputTheme}
        textAlignVertical="top"
        style={[
          typography.body,
          styles.input,
          { color: palette.textPrimary, height },
        ]}
      />
    </FieldBox>
  );
}

const styles = StyleSheet.create({
  input: { flex: 1, paddingVertical: spacing.md },
  counter: { textAlign: 'right', marginTop: spacing.xs },
});
