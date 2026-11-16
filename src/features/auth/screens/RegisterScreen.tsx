import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '@/api/errors';
import { AuthLayout } from '@/components/AuthLayout';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { PasswordRules } from '../components/PasswordRules';
import { useRegister } from '../hooks/useRegister';
import { registerSchema, type RegisterForm } from '../schemas';

export function RegisterScreen() {
  const { t } = useTranslation();
  const register = useRegister();
  const { control, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const submit = handleSubmit((form) =>
    register.mutate(form, {
      onSuccess: ({ resendAvailableAt }) =>
        router.replace({
          pathname: '/verify-email',
          params: { email: form.email.trim(), resendAvailableAt },
        }),
    }),
  );
  const fieldError = (message?: string) => (message ? t(message) : undefined);

  return (
    <AuthLayout title={t('register.title')}>
      {register.error ? (
        <Banner message={errorMessage(t, register.error)} />
      ) : null}

      {(['firstName', 'lastName', 'email'] as const).map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <TextField
              label={t(`register.${name}`)}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(formState.errors[name]?.message)}
              autoCapitalize={name === 'email' ? 'none' : 'words'}
              keyboardType={name === 'email' ? 'email-address' : 'default'}
            />
          )}
        />
      ))}
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label={t('register.password')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoComplete="new-password"
            password
          />
        )}
      />
      <PasswordRules password={password} />

      <Button
        label={t('register.submit')}
        icon="userAdd"
        loading={register.isPending}
        onPress={submit}
      />
      <Button
        label={t('register.hasAccount')}
        icon="signIn"
        variant="tonal"
        onPress={() => router.replace('/login')}
      />
    </AuthLayout>
  );
}
