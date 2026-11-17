import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { ModuleDetail } from '@/api/types';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SelectField } from '@/components/SelectField';
import { TextAreaField } from '@/components/TextAreaField';
import { TextField } from '@/components/TextField';
import { usePeriods } from '@/features/periods/hooks/usePeriods';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { spacing, typography, usePalette } from '@/theme';
import { PickerSheet } from '../components/PickerSheet';
import { ScheduleEditor, type SlotErrors } from '../components/ScheduleEditor';
import { useCreateModule } from '../hooks/useModules';
import { useTeachers } from '../hooks/useTeachers';
import { moduleSchema, type ModuleForm } from '../schemas';

type Sheet = 'period' | 'teacher' | 'room' | null;

export function ModuleFormScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const create = useCreateModule();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [search, setSearch] = useState('');
  const [created, setCreated] = useState<ModuleDetail | null>(null);

  const periods = usePeriods();
  const teachers = useTeachers(search, sheet === 'teacher');
  const rooms = useRooms({ search: sheet === 'room' ? search : '', status: 'ACTIVE' });
  const openPeriods = (periods.data?.data ?? []).filter(
    (p) => p.status !== 'CLOSED',
  );

  const { control, handleSubmit, formState, setValue, getValues } =
    useForm<ModuleForm>({
      resolver: zodResolver(moduleSchema),
      defaultValues: {
        periodId: '',
        name: '',
        description: '',
        teacherId: '',
        roomId: '',
        schedules: [{ dayOfWeek: 1, startTime: '', endTime: '' }],
      },
    });

  // The active period first, then the nearest upcoming one, unless the CAE already chose.
  useEffect(() => {
    if (getValues('periodId') || openPeriods.length === 0) return;
    const preferred =
      openPeriods.find((p) => p.status === 'ACTIVE') ?? openPeriods[0]!;
    setValue('periodId', preferred.id);
  }, [openPeriods, getValues, setValue]);

  const [chosen, setChosen] = useState<{ teacher?: string; room?: string }>({});
  const close = () => {
    setSheet(null);
    setSearch('');
  };
  const fieldError = (name: 'periodId' | 'name' | 'description' | 'teacherId' | 'roomId') => {
    const message = formState.errors[name]?.message;
    return message ? t(message) : undefined;
  };

  const scheduleErrors = formState.errors.schedules;
  const slotErrors: (SlotErrors | undefined)[] = Array.isArray(scheduleErrors)
    ? scheduleErrors.map((e) => ({
        startTime: e?.startTime?.message ? t(e.startTime.message) : undefined,
        endTime: e?.endTime?.message ? t(e.endTime.message) : undefined,
      }))
    : [];
  const scheduleListError = !Array.isArray(scheduleErrors)
    ? (scheduleErrors?.message ?? scheduleErrors?.root?.message)
    : undefined;

  if (created) {
    const total = created.schedules.reduce(
      (sum, s) => sum + (s.sessionsGenerated ?? 0),
      0,
    );
    const withoutSessions = created.schedules.some(
      (s) => s.sessionsGenerated === 0,
    );
    return (
      <SafeAreaView
        edges={['bottom', 'left', 'right']}
        style={[styles.screen, { backgroundColor: palette.screen }]}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
            {t('modules.result.title')}
          </Text>
          <Card style={styles.result}>
            <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>
              {created.name}
            </Text>
            <Text style={[typography.body, { color: palette.textSecondary }]}>
              {t('modules.result.capacity', { count: created.capacity })}
            </Text>
            <Text style={[typography.body, { color: palette.textSecondary }]}>
              {t('modules.result.sessions', { count: total })}
            </Text>
          </Card>
          {withoutSessions ? (
            <Banner message={t('modules.result.noSessions')} />
          ) : null}
          <Button
            label={t('modules.result.done')}
            icon="success"
            onPress={() => router.back()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          {t('modules.form.createTitle')}
        </Text>
        {create.error ? <Banner message={errorMessage(t, create.error)} /> : null}
        {periods.isSuccess && openPeriods.length === 0 ? (
          <Banner message={t('modules.form.noPeriods')} />
        ) : null}

        <Controller
          control={control}
          name="periodId"
          render={({ field }) => (
            <SelectField
              label={t('modules.form.period')}
              leadingIcon="dateRange"
              onCard={false}
              placeholder={t('modules.form.periodPlaceholder')}
              value={openPeriods.find((p) => p.id === field.value)?.name}
              error={fieldError('periodId')}
              onPress={() => setSheet('period')}
            />
          )}
        />
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              label={t('modules.form.name')}
              leadingIcon="modules"
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
          name="description"
          render={({ field }) => (
            <TextAreaField
              label={t('modules.form.description')}
              leadingIcon="list"
              onCard={false}
              maxLength={1000}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError('description')}
            />
          )}
        />
        <Controller
          control={control}
          name="teacherId"
          render={() => (
            <SelectField
              label={t('modules.form.teacher')}
              leadingIcon="teacher"
              onCard={false}
              placeholder={t('modules.form.teacherPlaceholder')}
              value={chosen.teacher}
              error={fieldError('teacherId')}
              onPress={() => setSheet('teacher')}
            />
          )}
        />
        <Controller
          control={control}
          name="roomId"
          render={() => (
            <SelectField
              label={t('modules.form.room')}
              leadingIcon="building"
              onCard={false}
              placeholder={t('modules.form.roomPlaceholder')}
              value={chosen.room}
              error={fieldError('roomId')}
              onPress={() => setSheet('room')}
            />
          )}
        />
        <Controller
          control={control}
          name="schedules"
          render={({ field }) => (
            <ScheduleEditor
              value={field.value}
              onChange={field.onChange}
              slotErrors={slotErrors}
              error={scheduleListError ? t(scheduleListError) : undefined}
            />
          )}
        />

        <View style={styles.actions}>
          <Button
            label={t('modules.form.save')}
            icon="success"
            loading={create.isPending}
            onPress={handleSubmit((form) =>
              create.mutate(
                { ...form, description: form.description || null },
                { onSuccess: setCreated },
              ),
            )}
          />
        </View>
      </ScrollView>

      <PickerSheet
        visible={sheet === 'period'}
        title={t('modules.form.period')}
        options={openPeriods.map((p) => ({
          value: p.id,
          label: p.name,
          hint: t(`periods.status.${p.status}`),
        }))}
        selected={getValues('periodId')}
        loading={periods.isPending}
        error={periods.isError ? errorMessage(t, periods.error) : undefined}
        emptyText={t('modules.form.noPeriods')}
        onClose={close}
        onSelect={(id) => {
          setValue('periodId', id, { shouldValidate: true });
          close();
        }}
      />
      <PickerSheet
        visible={sheet === 'teacher'}
        title={t('modules.form.teacher')}
        search={{ label: t('modules.form.searchTeacher'), value: search, onChange: setSearch }}
        options={(teachers.data?.data ?? []).map((teacher) => ({
          value: teacher.id,
          label: `${teacher.firstName} ${teacher.lastName}`,
        }))}
        selected={getValues('teacherId')}
        loading={teachers.isPending}
        error={teachers.isError ? errorMessage(t, teachers.error) : undefined}
        emptyText={t('modules.form.noTeachers')}
        onClose={close}
        onSelect={(id) => {
          const teacher = teachers.data?.data.find((x) => x.id === id);
          setValue('teacherId', id, { shouldValidate: true });
          setChosen((c) => ({
            ...c,
            teacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
          }));
          close();
        }}
      />
      <PickerSheet
        visible={sheet === 'room'}
        title={t('modules.form.room')}
        search={{ label: t('modules.form.searchRoom'), value: search, onChange: setSearch }}
        options={(rooms.data?.data ?? []).map((room) => ({
          value: room.id,
          label: `${room.locationName} · ${room.name}`,
          hint: t('rooms.capacity', { count: room.capacity }),
        }))}
        selected={getValues('roomId')}
        loading={rooms.isPending}
        error={rooms.isError ? errorMessage(t, rooms.error) : undefined}
        emptyText={t('modules.form.noRooms')}
        onClose={close}
        onSelect={(id) => {
          const room = rooms.data?.data.find((x) => x.id === id);
          setValue('roomId', id, { shouldValidate: true });
          setChosen((c) => ({
            ...c,
            room: room ? `${room.locationName} · ${room.name}` : undefined,
          }));
          close();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  actions: { gap: spacing.lg },
  result: { gap: spacing.sm },
});
