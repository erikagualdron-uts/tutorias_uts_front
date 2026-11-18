import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ApiError, errorMessage } from '@/api/errors';
import { AuthLayout } from '@/components/AuthLayout';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useSession } from '@/store/session';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginForm } from '../schemas';

export function LoginScreen() {
  const { t } = useTranslation();
  const login = useLogin();
  const { verified, reset } = useLocalSearchParams<{
    verified?: string;
    reset?: string;
  }>();
  const signOutReason = useSession((state) => state.signOutReason);
  const { control, handleSubmit, formState, getValues } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const fieldError = (message?: string) => (message ? t(message) : undefined);

  return (
    <AuthLayout title={t('login.title')}>
      {login.error ? (
        <Banner message={errorMessage(t, login.error)} />
      ) : verified || reset ? (
        <Banner
          message={t(verified ? 'login.verified' : 'login.passwordReset')}
        />
      ) : signOutReason ? (
        <Banner
          message={t(`errors.${signOutReason}`, {
            defaultValue: t('errors.UNKNOWN'),
          })}
        />
      ) : null}

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label={t('login.email')}
            leadingIcon="email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(formState.errors.email?.message)}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label={t('login.password')}
            leadingIcon="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(formState.errors.password?.message)}
            autoComplete="password"
            password
          />
        )}
      />
      <>
        <Button
          label={t('login.submit')}
          icon="signIn"
          loading={login.isPending}
          onPress={handleSubmit((form) => login.mutate(form))}
        />
        {login.error instanceof ApiError &&
        login.error.code === 'EMAIL_NOT_VERIFIED' ? (
          <Button
            label={t('login.verifyEmail')}
            icon="email"
            variant="outlined"
            onPress={() =>
              router.push({
                pathname: '/verify-email',
                params: { email: getValues('email').trim() },
              })
            }
          />
        ) : null}
        <Button
          label={t('login.forgot')}
          variant="link"
          onPress={() => router.push('/forgot-password')}
        />
        <Button
          label={t('login.createAccount')}
          icon="userAdd"
          variant="tonal"
          onPress={() => router.push('/register')}
        />
      </>
    </AuthLayout>
  );
}
