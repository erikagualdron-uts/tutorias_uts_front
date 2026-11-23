import { zodResolver } from '@hookform/resolvers/zod';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/errors';
import type { PqrsLimits } from '@/api/types';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { TextAreaField } from '@/components/TextAreaField';
import { TextField } from '@/components/TextField';
import { useDropdownItems } from '@/features/dropdown-lists/hooks/useDropdownLists';
import { labelFor } from '@/features/dropdown-lists/schemas';
import { useSession } from '@/store/session';
import { spacing, typography, usePalette } from '@/theme';
import { useCreatePqrs, usePqrsLimits } from '../hooks/useAuthorPqrs';
import { newRequestId } from '../requestId';
import { createPqrsSchema, type CreatePqrsForm } from '../schemas';

export function NewPqrsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const limits = usePqrsLimits();
  const types = useDropdownItems('PQRS_TYPE');
  const retry = () => {
    void limits.refetch();
    void types.refetch();
  };

  const body = limits.isPending || types.isPending ? (
    <BrandLoader />
  ) : limits.isError || types.isError ? (
    <EmptyState
      title={t('pqrs.new.typesError')}
      description={errorMessage(t, limits.error ?? types.error)}
      action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={retry} />}
    />
  ) : types.data.length === 0 ? (
    <EmptyState title={t('pqrs.new.typesError')} description={t('pqrs.new.noTypes')} />
  ) : (
    <Form limits={limits.data} />
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('pqrs.new.title')}</Text>
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

function Form({ limits }: { limits: PqrsLimits }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const types = useDropdownItems('PQRS_TYPE').data ?? [];
  const create = useCreatePqrs();
  const base = useSession((state) => (state.user?.role === 'TEACHER' ? '/(teacher)/pqrs' : '/(student)/pqrs'));
  // Kept while the form is open so a retry or a double tap files only one PQRS.
  const [requestId] = useState(newRequestId);
  const schema = useMemo(() => createPqrsSchema(limits), [limits]);
  const { control, handleSubmit, formState } = useForm<CreatePqrsForm>({
    resolver: zodResolver(schema),
    defaultValues: { typeId: '', subject: '', description: '' },
  });

  const serverFields =
    create.error instanceof ApiError ? (create.error.details?.fields as Record<string, string> | undefined) : undefined;
  const fieldError = (name: keyof CreatePqrsForm) => {
    const local = formState.errors[name]?.message;
    if (local) return t(local);
    const remote = serverFields?.[name];
    return remote && t(remote === 'maxLength' ? 'validation.tooLong' : 'validation.required');
  };
  const submit = handleSubmit((form) => {
    if (create.isPending) return;
    // `replace`: going back from the confirmation must not return to a form that was already sent.
    create.mutate(
      { clientRequestId: requestId, ...form },
      { onSuccess: ({ id, createdAt, status }) => router.replace({ pathname: `${base}/filed`, params: { id, createdAt, status } } as Href) },
    );
  });

  return (
    <>
      {create.error && !serverFields ? <Banner message={errorMessage(t, create.error)} severity="error" /> : null}
      <Controller
        control={control}
        name="typeId"
        render={({ field }) => (
          <>
            <Text style={[typography.label, { color: palette.textPrimary }]}>{t('pqrs.new.type')}</Text>
            <FilterChips
              options={types.map((item) => ({ value: item.id, label: labelFor(item, i18n.language) }))}
              value={field.value || undefined}
              onChange={(value) => field.onChange(value ?? '')}
            />
            {fieldError('typeId') ? <Text style={[typography.bodySmall, { color: palette.errorText }]}>{fieldError('typeId')}</Text> : null}
          </>
        )}
      />
      <Controller
        control={control}
        name="subject"
        render={({ field }) => (
          <TextField
            label={t('pqrs.new.subject')}
            leadingIcon="pqrs"
            onCard={false}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError('subject')}
            maxLength={limits.subjectMaxLength}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextAreaField
            label={t('pqrs.new.description')}
            leadingIcon="edit"
            onCard={false}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError('description')}
            maxLength={limits.descriptionMaxLength}
          />
        )}
      />
      <Button label={t('pqrs.new.submit')} icon="send" loading={create.isPending} onPress={submit} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
