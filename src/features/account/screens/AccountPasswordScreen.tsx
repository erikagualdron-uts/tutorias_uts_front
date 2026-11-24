import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { PasswordFields } from '@/features/auth/components/PasswordFields';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import { ROLE_HOME } from '@/features/auth/routing';
import { changePasswordSchema, type ChangePasswordForm } from '@/features/auth/schemas';
import { useSession } from '@/store/session';
import { spacing, usePalette } from '@/theme';

// Voluntary password change from "My account" (spec 032). The session stays open; the forced change
// after a temporary password keeps its own screen.
export function AccountPasswordScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const role = useSession((state) => state.user?.role);
  const change = useChangePassword();
  const { control, handleSubmit, formState } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const submit = handleSubmit((form) =>
    change.mutate(form, {
      onSuccess: () => {
        if (!role) return;
        router.replace({
          pathname: `${ROLE_HOME[role]}/account`,
          params: { passwordChanged: '1' },
        } as never);
      },
    }),
  );

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {change.error ? <Banner message={errorMessage(t, change.error)} severity="error" /> : null}
        <PasswordFields control={control} errors={formState.errors} />
        <Button
          label={t('changePassword.submit')}
          icon="key"
          loading={change.isPending}
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
