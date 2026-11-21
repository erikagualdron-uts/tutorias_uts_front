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
import { DateField } from '@/components/DateField';
import { TextField } from '@/components/TextField';
import { todayInBogota } from '@/date/day';
import { spacing, typography, usePalette } from '@/theme';
import { useDeleteHoliday, useHolidays, useSaveHoliday } from '../hooks/useHolidays';
import { holidaySchema, type HolidayForm } from '../schemas';

// Create or edit a holiday. Saving or deleting one changes sessions, so the result says how many.
export function HolidayFormScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id, year } = useLocalSearchParams<{ id?: string; year?: string }>();
  const today = todayInBogota();
  // The list is already loaded when the person comes from it; the holiday is found in it.
  const holidays = useHolidays(Number(year ?? today.slice(0, 4)));
  const save = useSaveHoliday(id);
  const remove = useDeleteHoliday(id ?? '');
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string[] | null>(null);

  const { control, handleSubmit, formState, reset } = useForm<HolidayForm>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { name: '', date: '' },
  });
  const current = id ? holidays.data?.data.find((h) => h.id === id) : undefined;
  useEffect(() => {
    if (current) reset({ name: current.name, date: current.date });
  }, [current, reset]);

  if (id && holidays.isPending) return <LoadingScreen />;
  const failure = save.error ?? remove.error;
  const fieldError = (name: keyof HolidayForm) => {
    const message = formState.errors[name]?.message;
    return message ? t(message) : undefined;
  };

  if (notice) {
    return (
      <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('holidays.result.title')}</Text>
          {notice.map((line) => (
            <Banner key={line} message={line} />
          ))}
          <Button label={t('modules.result.done')} icon="success" onPress={() => router.back()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t(id ? 'holidays.form.editTitle' : 'holidays.form.createTitle')}
        </Text>
        {failure && !deleting ? <Banner message={errorMessage(t, failure)} /> : null}
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              label={t('holidays.form.name')}
              leadingIcon="holiday"
              onCard={false}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError('name')}
            />
          )}
        />
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DateField
              label={t('holidays.form.date')}
              placeholder={t('dateField.placeholder')}
              hint={t('holidays.form.dateHint')}
              minDate={today}
              value={field.value}
              onChange={field.onChange}
              error={fieldError('date')}
              onCard={false}
            />
          )}
        />
        <Button
          label={t('holidays.form.save')}
          icon="success"
          loading={save.isPending}
          onPress={handleSubmit((form) =>
            save.mutate(form, {
              onSuccess: ({ cancelledSessions }) =>
                cancelledSessions > 0
                  ? setNotice([t('holidays.result.cancelled', { count: cancelledSessions })])
                  : router.back(),
            }),
          )}
        />
        {id ? <Button label={t('holidays.form.delete')} icon="trash" variant="outlined" onPress={() => setDeleting(true)} /> : null}
      </ScrollView>

      {deleting ? (
        <ConfirmDialog
          title={t('holidays.form.deleteTitle')}
          message={t('holidays.form.deleteMessage')}
          confirmLabel={t('holidays.form.delete')}
          confirmIcon="trash"
          loading={remove.isPending}
          onConfirm={() =>
            remove.mutate(undefined, {
              onSuccess: (result) => {
                setDeleting(false);
                setNotice([
                  t('holidays.result.restored', { count: result.restored }),
                  ...(result.generated > 0 ? [t('holidays.result.generated', { count: result.generated })] : []),
                  ...(result.notRestored.length > 0 ? [t('holidays.result.notRestored', { count: result.notRestored.length })] : []),
                ]);
              },
              onError: () => setDeleting(false),
            })
          }
          onCancel={() => setDeleting(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
