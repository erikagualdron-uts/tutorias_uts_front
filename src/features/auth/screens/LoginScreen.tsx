import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useSession } from '@/store/session';
import { spacing, typography, usePalette } from '@/theme';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginForm } from '../schemas';

export function LoginScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const login = useLogin();
  const { verified } = useLocalSearchParams<{ verified?: string }>();
  const signOutReason = useSession((state) => state.signOutReason);
  const { control, handleSubmit, formState, getValues } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const fieldError = (message?: string) => (message ? t(message) : undefined);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('login.title')}
        </Text>

        {login.error ? (
          <Banner message={errorMessage(t, login.error)} />
        ) : verified ? (
          <Banner message={t('login.verified')} />
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
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(formState.errors.password?.message)}
              autoComplete="password"
              password
            />
          )}
        />
        <View>
          <Button
            label={t('login.submit')}
            loading={login.isPending}
            onPress={handleSubmit((form) => login.mutate(form))}
          />
          {login.error instanceof ApiError &&
          login.error.code === 'EMAIL_NOT_VERIFIED' ? (
            <Button
              label={t('login.verifyEmail')}
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
            label={t('login.createAccount')}
            variant="tonal"
            onPress={() => router.push('/register')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
