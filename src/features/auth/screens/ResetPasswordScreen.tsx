import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '@/api/errors';
import { AuthLayout } from '@/components/AuthLayout';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { PasswordRules } from '../components/PasswordRules';
import { useResetPassword } from '../hooks/usePasswordReset';
import { resetPasswordSchema, type ResetPasswordForm } from '../schemas';

export function ResetPasswordScreen() {
  const { t } = useTranslation();
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

  return (
    <AuthLayout
      title={t('reset.title')}
      description={t('reset.description', { email })}
    >
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
      <PasswordRules password={newPassword} />
      <Button
        label={t('reset.submit')}
        icon="password"
        loading={reset.isPending}
        onPress={submit}
      />
    </AuthLayout>
  );
}
