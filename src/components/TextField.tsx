import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
} from 'react-native';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { FIELD_HEIGHT, FieldBox } from './FieldBox';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  leadingIcon: IconName;
  error?: string;
  // Adds the show/hide toggle.
  password?: boolean;
  // False when the field sits on the screen background instead of a card.
  onCard?: boolean;
}

export function TextField({
  label,
  leadingIcon,
  error,
  password = false,
  onCard = true,
  ...inputProps
}: TextFieldProps) {
  const palette = usePalette();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const disabled = inputProps.editable === false;

  return (
    <FieldBox
      label={label}
      errorMessage={error}
      leadingIcon={leadingIcon}
      focused={focused}
      error={Boolean(error)}
      disabled={disabled}
      onCard={onCard}
      trailing={
        password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hidden ? t('common.showPassword') : t('common.hidePassword')
            }
            onPress={() => setHidden((value) => !value)}
            style={styles.toggle}
          >
            <Icon
              name={hidden ? 'show' : 'hide'}
              color={palette.textSecondary}
            />
          </Pressable>
        ) : undefined
      }
    >
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityHint={error}
        secureTextEntry={password && hidden}
        {...(password && { autoCapitalize: 'none', autoCorrect: false })}
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
  toggle: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    marginRight: -spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
