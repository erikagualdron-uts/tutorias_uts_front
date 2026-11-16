import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TemporaryPasswordDialog } from '@/components/TemporaryPasswordDialog';
import { TextField } from '@/components/TextField';
import { spacing, typography, usePalette } from '@/theme';
import { useCreateTeacher } from '../hooks/useCreateTeacher';
import { createTeacherSchema, type CreateTeacherForm } from '../schemas';

export function CreateTeacherScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const create = useCreateTeacher();
  // Lives only in this state: closing the dialog drops it for good.
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );
  const { control, handleSubmit, formState, reset } =
    useForm<CreateTeacherForm>({
      resolver: zodResolver(createTeacherSchema),
      defaultValues: { firstName: '', lastName: '', email: '' },
    });

  const submit = handleSubmit((form) =>
    create.mutate(form, {
      onSuccess: (result) => {
        setTemporaryPassword(result.temporaryPassword);
        reset();
      },
    }),
  );
  const domainError =
    create.error instanceof ApiError &&
    create.error.code === 'EMAIL_DOMAIN_NOT_ALLOWED';
  const emailError = domainError
    ? errorMessage(t, create.error)
    : formState.errors.email?.message && t(formState.errors.email.message);

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('teachers.create.title')}
        </Text>
        {create.error && !domainError ? (
          <Banner message={errorMessage(t, create.error)} />
        ) : null}

        {(['firstName', 'lastName', 'email'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <TextField
                label={t(`teachers.create.${name}`)}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={
                  name === 'email'
                    ? emailError || undefined
                    : formState.errors[name]?.message &&
                      t(formState.errors[name].message)
                }
                autoCapitalize={name === 'email' ? 'none' : 'words'}
                keyboardType={name === 'email' ? 'email-address' : 'default'}
              />
            )}
          />
        ))}
        <Button
          label={t('teachers.create.submit')}
          loading={create.isPending}
          onPress={submit}
        />
      </ScrollView>
      {temporaryPassword ? (
        <TemporaryPasswordDialog
          password={temporaryPassword}
          onClose={() => setTemporaryPassword(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
