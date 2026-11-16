import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '@/api/errors';
import { AuthLayout } from '@/components/AuthLayout';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useCountdown } from '../hooks/useCountdown';
import { useResendVerification, useVerifyEmail } from '../hooks/useVerifyEmail';
import { verifyEmailSchema, type VerifyEmailForm } from '../schemas';

export function VerifyEmailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    email?: string;
    resendAvailableAt?: string;
  }>();
  const email = params.email ?? '';
  const [resendAt, setResendAt] = useState(params.resendAvailableAt);
  const [resent, setResent] = useState(false);
  const secondsLeft = useCountdown(resendAt);

  const verify = useVerifyEmail(email);
  const resend = useResendVerification(email);
  const { control, handleSubmit, formState } = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: '' },
  });

  const submit = handleSubmit(({ code }) =>
    verify.mutate(code, {
      onSuccess: () =>
        router.replace({ pathname: '/login', params: { verified: '1' } }),
    }),
  );
  const resendCode = () =>
    resend.mutate(undefined, {
      onSuccess: ({ resendAvailableAt }) => {
        setResendAt(resendAvailableAt);
        setResent(true);
      },
    });

  const error = verify.error ?? resend.error;
  return (
    <AuthLayout
      title={t('verify.title')}
      description={t('verify.description', { email })}
    >
      {error ? (
        <Banner message={errorMessage(t, error)} />
      ) : resent ? (
        <Banner message={t('verify.resent')} />
      ) : null}

      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <TextField
            label={t('verify.code')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={
              formState.errors.code?.message
                ? t(formState.errors.code.message)
                : undefined
            }
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
          />
        )}
      />
      <Button
        label={t('verify.submit')}
        icon="success"
        loading={verify.isPending}
        onPress={submit}
      />
      <Button
        label={t('verify.resend')}
        icon="email"
        variant="outlined"
        loading={resend.isPending}
        disabled={secondsLeft > 0}
        helperText={t('verify.resendIn', { seconds: secondsLeft })}
        onPress={resendCode}
      />
    </AuthLayout>
  );
}
