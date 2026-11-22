import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { spacing, typography, usePalette } from '@/theme';
import { useAccountDetail, useUpdateTeacher } from '../hooks/useAccountActions';
import { teacherEditSchema, type TeacherEditForm } from '../schemas';

const FIELDS = ['firstName', 'lastName', 'phone'] as const;
const LABELS = {
  firstName: 'teachers.create.firstName',
  lastName: 'teachers.create.lastName',
  phone: 'teachers.edit.phone',
};

export function TeacherEditScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useAccountDetail('teacher', id);
  const update = useUpdateTeacher(id);
  const teacher = detail.data;
  const { control, handleSubmit, formState } = useForm<TeacherEditForm>({
    resolver: zodResolver(teacherEditSchema),
    values: {
      firstName: teacher?.firstName ?? '',
      lastName: teacher?.lastName ?? '',
      phone: teacher?.phone ?? '',
    },
  });

  // Field errors of a 400 come as `details.fields.<name> = <constraint>`.
  const serverFields =
    update.error instanceof ApiError
      ? (update.error.details?.fields as Record<string, string> | undefined)
      : undefined;
  const fieldError = (name: (typeof FIELDS)[number]) => {
    const local = formState.errors[name]?.message;
    if (local) return t(local);
    const remote = serverFields?.[name];
    return (
      remote &&
      t(remote === 'maxLength' ? 'validation.tooLong' : 'validation.required')
    );
  };
  const submit = handleSubmit((form) =>
    update.mutate(
      {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
      },
      { onSuccess: () => router.back() },
    ),
  );

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('teachers.edit.title')}
        </Text>
        {detail.isPending ? (
          <BrandLoader />
        ) : !teacher ? (
          <>
            <Banner
              message={`${t('teachers.edit.loadError')}. ${errorMessage(t, detail.error)}`}
              severity="error"
            />
            <Button
              label={t('common.tryAgain')}
              icon="restart"
              variant="tonal"
              onPress={() => detail.refetch()}
            />
          </>
        ) : (
          <>
            {update.error && !serverFields ? (
              <Banner
                message={errorMessage(t, update.error)}
                severity="error"
              />
            ) : null}
            {FIELDS.map((name) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <TextField
                    label={t(LABELS[name])}
                    leadingIcon={name === 'phone' ? 'phone' : 'user'}
                    onCard={false}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldError(name)}
                    autoCapitalize={name === 'phone' ? 'none' : 'words'}
                    keyboardType={name === 'phone' ? 'phone-pad' : 'default'}
                  />
                )}
              />
            ))}
            <TextField
              label={t('teachers.create.email')}
              leadingIcon="email"
              onCard={false}
              value={teacher.email}
              editable={false}
            />
            <Text
              style={[typography.bodySmall, { color: palette.textSecondary }]}
            >
              {t('teachers.edit.emailReason')}
            </Text>
            <Button
              label={t('teachers.edit.submit')}
              icon="success"
              loading={update.isPending}
              onPress={submit}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
