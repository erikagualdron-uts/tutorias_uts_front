import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '@/api/errors';
import { AuthLayout } from '@/components/AuthLayout';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { PasswordFields } from '../components/PasswordFields';
import { useChangePassword } from '../hooks/useChangePassword';
import { useSignOut } from '../hooks/useSignOut';
import { changePasswordSchema, type ChangePasswordForm } from '../schemas';

// Blocks all navigation until done: the route gate keeps the user here while mustChangePassword is true.
export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const change = useChangePassword();
  const signOut = useSignOut();
  const { control, handleSubmit, formState } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  return (
    <AuthLayout
      title={t('changePassword.title')}
      description={t('changePassword.description')}
    >
      {change.error ? <Banner message={errorMessage(t, change.error)} severity="error" /> : null}

      <PasswordFields control={control} errors={formState.errors} />
      <Button
        label={t('changePassword.submit')}
        icon="password"
        loading={change.isPending}
        onPress={handleSubmit((form) => change.mutate(form))}
      />
      <Button
        label={t('profile.signOut')}
        icon="signOut"
        variant="tonal"
        onPress={() => void signOut()}
      />
    </AuthLayout>
  );
}
