import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import {
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  typography,
  usePalette,
} from '@/theme';
import {
  useDeleteRoom,
  useLocations,
  useRoom,
  useRoomImpact,
  useSaveRoom,
  useToggleRoom,
} from '../hooks/useRooms';
import { roomSchema, type RoomForm } from '../schemas';

type Dialog = 'deactivate' | 'delete' | null;

export function RoomFormScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const room = useRoom(id);
  const locations = useLocations();
  const save = useSaveRoom(id);
  const toggle = useToggleRoom(id ?? '');
  const remove = useDeleteRoom(id ?? '');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [picking, setPicking] = useState(false);
  const impact = useRoomImpact(id ?? '', dialog === 'deactivate');

  const { control, handleSubmit, formState, reset, setValue } =
    useForm<RoomForm>({
      resolver: zodResolver(roomSchema),
      defaultValues: { locationId: '', name: '', capacity: '' },
    });
  useEffect(() => {
    if (room.data) {
      reset({
        locationId: room.data.locationId,
        name: room.data.name,
        capacity: String(room.data.capacity),
      });
    }
  }, [room.data, reset]);

  const done = { onSuccess: () => router.back() };
  const failure = [save, toggle, remove].find((m) => m.error)?.error;
  const closeOnError = { ...done, onError: () => setDialog(null) };

  if (id && room.isPending) return <LoadingScreen />;
  if (id && room.isError)
    return (
      <EmptyState
        title={t('rooms.loadError')}
        description={errorMessage(t, room.error)}
        action={
          <Button
            label={t('common.tryAgain')}
            icon="restart"
            variant="tonal"
            onPress={() => room.refetch()}
          />
        }
      />
    );

  const fieldError = (name: keyof RoomForm) => {
    const message = formState.errors[name]?.message;
    return message ? t(message) : undefined;
  };
  const upcoming = impact.data?.modulesInUpcomingPeriods ?? 0;

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
          {t(id ? 'rooms.editTitle' : 'rooms.createTitle')}
        </Text>
        {failure && dialog === null ? (
          <Banner message={errorMessage(t, failure)} severity="error" />
        ) : null}
        {locations.data?.data.length === 0 ? (
          <Banner message={t('rooms.form.noLocations')} severity="warning" />
        ) : null}

        <Controller
          control={control}
          name="locationId"
          render={({ field }) => (
            <SelectField
              label={t('rooms.form.location')}
              leadingIcon="location"
              onCard={false}
              placeholder={t('rooms.form.locationPlaceholder')}
              value={
                locations.data?.data.find((l) => l.id === field.value)?.name
              }
              error={fieldError('locationId')}
              onPress={() => setPicking(true)}
            />
          )}
        />
        {(['name', 'capacity'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <TextField
                label={t(`rooms.form.${name}`)}
                leadingIcon={name === 'name' ? 'building' : 'capacity'}
                onCard={false}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(name)}
                autoCapitalize="characters"
                keyboardType={name === 'capacity' ? 'number-pad' : 'default'}
              />
            )}
          />
        ))}

        <Button
          label={t('rooms.form.save')}
          icon="success"
          loading={save.isPending}
          onPress={handleSubmit((form) =>
            save.mutate({ ...form, capacity: Number(form.capacity) }, done),
          )}
        />
        {room.data?.status === 'ACTIVE' ? (
          <Button
            label={t('rooms.actions.deactivate')}
            icon="power"
            variant="tonal"
            onPress={() => setDialog('deactivate')}
          />
        ) : null}
        {room.data?.status === 'INACTIVE' ? (
          <Button
            label={t('rooms.actions.reactivate')}
            icon="restart"
            variant="tonal"
            loading={toggle.isPending}
            onPress={() => toggle.mutate('reactivate')}
          />
        ) : null}
        {room.data ? (
          <Button
            label={t('rooms.actions.delete')}
            icon="trash"
            variant="outlined"
            onPress={() => setDialog('delete')}
          />
        ) : null}
      </ScrollView>

      {picking ? (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setPicking(false)}
        >
          <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
            <View style={[styles.sheet, { backgroundColor: palette.card }]}>
              {locations.data?.data.map((location) => (
                <Pressable
                  key={location.id}
                  accessibilityRole="button"
                  accessibilityLabel={location.name}
                  style={styles.option}
                  onPress={() => {
                    setValue('locationId', location.id, {
                      shouldValidate: true,
                    });
                    setPicking(false);
                  }}
                >
                  <Text
                    style={[typography.body, { color: palette.textPrimary }]}
                  >
                    {location.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      ) : null}
      {dialog === 'deactivate' ? (
        <ConfirmDialog
          title={t('rooms.confirm.deactivate.title')}
          message={[
            t('rooms.confirm.deactivate.message'),
            upcoming > 0
              ? t('rooms.confirm.deactivate.upcoming', { count: upcoming })
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          confirmLabel={t('rooms.actions.deactivate')}
          confirmIcon="power"
          loading={toggle.isPending || impact.isPending}
          onConfirm={() => toggle.mutate('deactivate', closeOnError)}
          onCancel={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'delete' ? (
        <ConfirmDialog
          title={t('rooms.confirm.delete.title')}
          message={t('rooms.confirm.delete.message')}
          confirmLabel={t('rooms.actions.delete')}
          confirmIcon="trash"
          variant="destructive"
          loading={remove.isPending}
          onConfirm={() => remove.mutate(undefined, closeOnError)}
          onCancel={() => setDialog(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  sheet: { borderRadius: radius.sheet, padding: spacing.sm },
  option: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
