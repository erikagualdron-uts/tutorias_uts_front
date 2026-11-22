import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { spacing, typography, usePalette } from '@/theme';
import {
  useDeleteLocation,
  useLocation,
  useSaveLocation,
} from '../hooks/useRooms';
import { locationSchema, type LocationForm } from '../schemas';

export function LocationFormScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const location = useLocation(id);
  const save = useSaveLocation(id);
  const remove = useDeleteLocation(id ?? '');
  const [confirming, setConfirming] = useState(false);

  const { control, handleSubmit, formState, reset } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: '' },
  });
  useEffect(() => {
    if (location.data) reset({ name: location.data.name });
  }, [location.data, reset]);

  const done = { onSuccess: () => router.back() };
  const failure = save.error ?? remove.error;

  if (id && location.isPending) return <LoadingScreen />;
  if (id && location.isError)
    return (
      <EmptyState
        title={t('locations.loadError')}
        description={errorMessage(t, location.error)}
        action={
          <Button
            label={t('common.tryAgain')}
            icon="restart"
            variant="tonal"
            onPress={() => location.refetch()}
          />
        }
      />
    );

  const counts = location.data?.roomCounts;
  const blocked = (counts?.active ?? 0) > 0;
  const message = [
    t('locations.confirm.delete.message'),
    counts && counts.inactive > 0
      ? t('locations.confirm.delete.withRooms', { count: counts.inactive })
      : '',
  ]
    .filter(Boolean)
    .join(' ');

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
          {t(id ? 'locations.editTitle' : 'locations.createTitle')}
        </Text>
        {failure && !confirming ? (
          <Banner message={errorMessage(t, failure)} severity="error" />
        ) : null}
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              label={t('locations.form.name')}
              leadingIcon="location"
              onCard={false}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={
                formState.errors.name?.message
                  ? t(formState.errors.name.message)
                  : undefined
              }
            />
          )}
        />
        <Button
          label={t('locations.form.save')}
          icon="success"
          loading={save.isPending}
          onPress={handleSubmit((form) => save.mutate(form, done))}
        />
        {location.data ? (
          <Button
            label={t('locations.actions.delete')}
            icon="trash"
            variant="outlined"
            disabled={blocked}
            helperText={t('locations.rules.activeRooms')}
            onPress={() => setConfirming(true)}
          />
        ) : null}
      </ScrollView>
      {confirming ? (
        <ConfirmDialog
          title={t('locations.confirm.delete.title')}
          message={message}
          confirmLabel={t('locations.actions.delete')}
          confirmIcon="trash"
          variant="destructive"
          loading={remove.isPending}
          onConfirm={() =>
            remove.mutate(undefined, {
              ...done,
              onError: () => setConfirming(false),
            })
          }
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
