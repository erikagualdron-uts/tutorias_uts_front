import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { spacing, typography, usePalette } from '@/theme';
import { useChangePassword } from '../hooks/useChangePassword';
import { useSignOut } from '../hooks/useSignOut';
import { changePasswordSchema, type ChangePasswordForm } from '../schemas';

// Blocks all navigation until done: the route gate keeps the user here while mustChangePassword is true.
export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const change = useChangePassword();
  const signOut = useSignOut();
  const { control, handleSubmit, formState } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('changePassword.title')}
        </Text>
        <Text style={[typography.body, { color: palette.textSecondary }]}>
          {t('changePassword.description')}
        </Text>
        {change.error ? (
          <Banner message={errorMessage(t, change.error)} />
        ) : null}

        {(['currentPassword', 'newPassword'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <TextField
                label={t(
                  name === 'currentPassword'
                    ? 'changePassword.current'
                    : 'changePassword.new',
                )}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={
                  formState.errors[name]?.message
                    ? t(formState.errors[name].message)
                    : undefined
                }
                autoComplete={
                  name === 'newPassword' ? 'new-password' : 'current-password'
                }
                password
              />
            )}
          />
        ))}
        <Button
          label={t('changePassword.submit')}
          loading={change.isPending}
          onPress={handleSubmit((form) => change.mutate(form))}
        />
        <Button
          label={t('profile.signOut')}
          variant="tonal"
          onPress={() => void signOut()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
