import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DateField } from '@/components/DateField';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { addDays, isValidDay } from '@/date/day';
import { spacing, typography, usePalette } from '@/theme';
import {
  useActivatePeriod,
  useClosePeriod,
  useDeletePeriod,
  usePeriod,
  useSavePeriod,
} from '../hooks/usePeriods';
import { periodSchema, type PeriodForm } from '../schemas';

type Dialog = 'activate' | 'activateReplace' | 'close' | 'delete' | null;

export function PeriodFormScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const period = usePeriod(id);
  const save = useSavePeriod(id);
  const activate = useActivatePeriod(id ?? '');
  const close = useClosePeriod(id ?? '');
  const remove = useDeletePeriod(id ?? '');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [replacedName, setReplacedName] = useState('');

  const { control, handleSubmit, formState, reset, getValues, trigger } =
    useForm<PeriodForm>({
      resolver: zodResolver(periodSchema),
      defaultValues: { name: '', startsOn: '', endsOn: '' },
    });
  const startsOn = useWatch({ control, name: 'startsOn' });
  useEffect(() => {
    if (period.data) {
      const { name, startsOn, endsOn } = period.data;
      reset({ name, startsOn, endsOn });
    }
  }, [period.data, reset]);

  const readOnly = period.data?.status === 'CLOSED';
  const done = { onSuccess: () => router.back() };
  const failure = [save, activate, close, remove].find((m) => m.error)?.error;

  const confirmActivate = (confirmCloseActive: boolean) =>
    activate.mutate(confirmCloseActive, {
      ...done,
      onError: (error) => {
        // The server asks for confirmation before closing the current active period.
        if (
          error instanceof ApiError &&
          error.code === 'PERIOD_ACTIVE_EXISTS'
        ) {
          const active = error.details?.activePeriod as
            { name?: string } | undefined;
          setReplacedName(active?.name ?? '');
          setDialog('activateReplace');
        } else {
          setDialog(null);
        }
      },
    });

  if (id && period.isPending) return <LoadingScreen />;
  if (id && period.isError)
    return (
      <EmptyState
        title={t('periods.loadError')}
        description={errorMessage(t, period.error)}
        action={
          <Button
            label={t('common.tryAgain')}
            icon="restart"
            variant="tonal"
            onPress={() => period.refetch()}
          />
        }
      />
    );

  const fieldError = (name: keyof PeriodForm) => {
    const message = formState.errors[name]?.message;
    return message ? t(message) : undefined;
  };
  const deleteBlocked =
    period.data &&
    (period.data.status !== 'UPCOMING' || period.data.hasModules);
  const deleteRule = period.data?.hasModules
    ? t('periods.rules.deleteHasModules')
    : t('periods.rules.deleteOnlyUpcoming');

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
          {t(id ? 'periods.editTitle' : 'periods.createTitle')}
        </Text>
        {readOnly ? (
          <Banner message={t('periods.rules.closedReadOnly')} />
        ) : null}
        {failure && dialog === null ? (
          <Banner message={errorMessage(t, failure)} severity="error" />
        ) : null}

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              label={t('periods.form.name')}
              leadingIcon="list"
              onCard={false}
              editable={!readOnly}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError('name')}
              autoCapitalize="none"
            />
          )}
        />

        {(['startsOn', 'endsOn'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <DateField
                label={t(`periods.form.${name}`)}
                placeholder={t('dateField.placeholder')}
                onCard={false}
                disabled={readOnly}
                value={field.value}
                minDate={
                  name === 'endsOn' && isValidDay(startsOn)
                    ? addDays(startsOn, 1)
                    : undefined
                }
                hint={
                  name === 'endsOn'
                    ? t('periods.form.endAfterStart')
                    : undefined
                }
                onChange={(day) => {
                  field.onChange(day);
                  // Moving the start can break the end: show it now, not at save time.
                  if (name === 'startsOn' && getValues('endsOn'))
                    void trigger('endsOn');
                }}
                onBlur={field.onBlur}
                error={fieldError(name)}
              />
            )}
          />
        ))}

        {!readOnly ? (
          <Button
            label={t('periods.form.save')}
            icon="success"
            loading={save.isPending}
            onPress={handleSubmit((form) => save.mutate(form, done))}
          />
        ) : null}
        {period.data?.status === 'UPCOMING' ? (
          <Button
            label={t('periods.actions.activate')}
            icon="activate"
            variant="tonal"
            onPress={() => setDialog('activate')}
          />
        ) : null}
        {period.data?.status === 'ACTIVE' ? (
          <Button
            label={t('periods.actions.close')}
            icon="stopPeriod"
            variant="tonal"
            onPress={() => setDialog('close')}
          />
        ) : null}
        {period.data ? (
          <Button
            label={t('periods.actions.delete')}
            icon="trash"
            variant="outlined"
            disabled={!!deleteBlocked}
            helperText={deleteRule}
            onPress={() => setDialog('delete')}
          />
        ) : null}
      </ScrollView>

      {dialog === 'activate' || dialog === 'activateReplace' ? (
        <ConfirmDialog
          title={t(`periods.confirm.${dialog}.title`)}
          message={t(`periods.confirm.${dialog}.message`, {
            name: replacedName,
          })}
          confirmLabel={t('periods.actions.activate')}
          confirmIcon="activate"
          loading={activate.isPending}
          onConfirm={() => confirmActivate(dialog === 'activateReplace')}
          onCancel={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'close' ? (
        <ConfirmDialog
          title={t('periods.confirm.close.title')}
          message={t('periods.confirm.close.message')}
          confirmLabel={t('periods.actions.close')}
          confirmIcon="stopPeriod"
          loading={close.isPending}
          onConfirm={() =>
            close.mutate(undefined, { ...done, onError: () => setDialog(null) })
          }
          onCancel={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'delete' ? (
        <ConfirmDialog
          title={t('periods.confirm.delete.title')}
          message={t('periods.confirm.delete.message')}
          confirmLabel={t('periods.actions.delete')}
          confirmIcon="trash"
          variant="destructive"
          loading={remove.isPending}
          onConfirm={() =>
            remove.mutate(undefined, {
              ...done,
              onError: () => setDialog(null),
            })
          }
          onCancel={() => setDialog(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
