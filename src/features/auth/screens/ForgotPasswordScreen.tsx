import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '@/api/errors';
import { AuthLayout } from '@/components/AuthLayout';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useForgotPassword } from '../hooks/usePasswordReset';
import { forgotPasswordSchema, type ForgotPasswordForm } from '../schemas';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
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
    <AuthLayout title={t('forgot.title')} description={t('forgot.description')}>
      {forgot.error ? <Banner message={errorMessage(t, forgot.error)} /> : null}

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            leadingIcon="email"
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
        icon="email"
        loading={forgot.isPending}
        onPress={submit}
      />
    </AuthLayout>
  );
}
