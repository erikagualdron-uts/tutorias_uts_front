import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/components/TextField';
import type { ChangePasswordForm } from '../schemas';

// Current and new password fields, shared by the forced change and the voluntary one of "My account".
export function PasswordFields({
  control,
  errors,
}: {
  control: Control<ChangePasswordForm>;
  errors: FieldErrors<ChangePasswordForm>;
}) {
  const { t } = useTranslation();
  return (
    <>
      {(['currentPassword', 'newPassword'] as const).map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <TextField
              leadingIcon={name === 'currentPassword' ? 'password' : 'key'}
              label={t(
                name === 'currentPassword'
                  ? 'changePassword.current'
                  : 'changePassword.new',
              )}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors[name]?.message ? t(errors[name].message) : undefined}
              autoComplete={
                name === 'newPassword' ? 'new-password' : 'current-password'
              }
              password
            />
          )}
        />
      ))}
    </>
  );
}
