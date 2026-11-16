import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { spacing, typography, usePalette } from '@/theme';
import { useForgotPassword } from '../hooks/usePasswordReset';
import { forgotPasswordSchema, type ForgotPasswordForm } from '../schemas';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const forgot = useForgotPassword();
  const { control, handleSubmit, formState } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(({ email }) =>
    forgot.mutate(email, {
      onSuccess: () =>
        router.push({ pathname: '/reset-password', params: { email } }),
    }),
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('forgot.title')}
        </Text>
        <Text style={[typography.body, { color: palette.textSecondary }]}>
          {t('forgot.description')}
        </Text>
        {forgot.error ? (
          <Banner message={errorMessage(t, forgot.error)} />
        ) : null}

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label={t('forgot.email')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={
                formState.errors.email?.message
                  ? t(formState.errors.email.message)
                  : undefined
              }
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
          )}
        />
        <Button
          label={t('forgot.submit')}
          loading={forgot.isPending}
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
