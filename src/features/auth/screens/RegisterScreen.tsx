import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { spacing, typography, usePalette } from '@/theme';
import { useRegister } from '../hooks/useRegister';
import {
  PASSWORD_MIN_LENGTH,
  passwordRules,
  registerSchema,
  type RegisterForm,
} from '../schemas';

export function RegisterScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
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

  const rules = [
    {
      key: 'ruleLength',
      ok: passwordRules.length(password),
      options: { count: PASSWORD_MIN_LENGTH },
    },
    { key: 'ruleLetter', ok: passwordRules.letter(password), options: {} },
    { key: 'ruleNumber', ok: passwordRules.number(password), options: {} },
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
          {t('register.title')}
        </Text>
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
          label={t('register.submit')}
          loading={register.isPending}
          onPress={submit}
        />
        <Button
          label={t('register.hasAccount')}
          variant="tonal"
          onPress={() => router.replace('/login')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
