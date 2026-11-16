import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { spacing, typography, usePalette } from '@/theme';
import { useResetPassword } from '../hooks/usePasswordReset';
import {
  PASSWORD_MIN_LENGTH,
  passwordRules,
  resetPasswordSchema,
  type ResetPasswordForm,
} from '../schemas';

export function ResetPasswordScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const reset = useResetPassword(email);
  const { control, handleSubmit, formState } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', newPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  const submit = handleSubmit((form) =>
    reset.mutate(form, {
      onSuccess: () =>
        router.replace({ pathname: '/login', params: { reset: '1' } }),
    }),
  );
  const fieldError = (message?: string) => (message ? t(message) : undefined);
  const rules = [
    {
      key: 'ruleLength',
      ok: passwordRules.length(newPassword),
      options: { count: PASSWORD_MIN_LENGTH },
    },
    { key: 'ruleLetter', ok: passwordRules.letter(newPassword), options: {} },
    { key: 'ruleNumber', ok: passwordRules.number(newPassword), options: {} },
  ];

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('reset.title')}
        </Text>
        <Text style={[typography.body, { color: palette.textSecondary }]}>
          {t('reset.description', { email })}
        </Text>
        {reset.error ? <Banner message={errorMessage(t, reset.error)} /> : null}

        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <TextField
              label={t('reset.code')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(formState.errors.code?.message)}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field }) => (
            <TextField
              label={t('reset.newPassword')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(formState.errors.newPassword?.message)}
              autoComplete="new-password"
              password
            />
          )}
        />
        <View accessibilityRole="summary">
          <Text style={[typography.metadata, { color: palette.textSecondary }]}>
            {t('register.rulesTitle')}
          </Text>
          {rules.map(({ key, ok, options }) => (
            <Text
              key={key}
              style={[
                typography.metadata,
                { color: ok ? palette.textPrimary : palette.textSecondary },
              ]}
              accessibilityState={{ checked: ok }}
            >
              {ok ? '✓ ' : '• '}
              {t(`register.${key}`, options)}
            </Text>
          ))}
        </View>
        <Button
          label={t('reset.submit')}
          loading={reset.isPending}
          onPress={submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
