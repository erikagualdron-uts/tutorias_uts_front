import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import {
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  typography,
  usePalette,
} from '@/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  // Adds the show/hide toggle.
  password?: boolean;
  leadingIcon?: IconName;
}

export function TextField({
  label,
  error,
  password = false,
  leadingIcon,
  ...inputProps
}: TextFieldProps) {
  const palette = usePalette();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error
    ? palette.error
    : focused
      ? palette.link
      : 'transparent';

  return (
    <View>
      <Text style={[typography.label, { color: palette.textPrimary }]}>
        {label}
      </Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: palette.surface,
            borderColor,
            borderWidth: focused || error ? 2 : 0,
          },
        ]}
      >
        {leadingIcon && (
          <View style={styles.leading}>
            <Icon name={leadingIcon} color={palette.textSecondary} />
          </View>
        )}
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
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
          placeholderTextColor={palette.textSecondary}
          style={[
            typography.body,
            styles.input,
            { color: palette.textPrimary },
          ]}
        />
        {password && (
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
        )}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.metadata, styles.error, { color: palette.error }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: MIN_TOUCH_TARGET,
    marginTop: spacing.xs,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
  },
  leading: { paddingLeft: spacing.lg },
  toggle: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { marginTop: spacing.xs },
});
