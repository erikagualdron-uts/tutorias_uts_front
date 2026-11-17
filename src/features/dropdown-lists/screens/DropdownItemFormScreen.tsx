import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { spacing, typography, usePalette } from '@/theme';
import {
  useDeleteItem,
  useDropdownList,
  useSaveItem,
} from '../hooks/useDropdownLists';
import { itemSchema, type ItemForm } from '../schemas';

type Dialog = 'deactivate' | 'delete' | null;

export function DropdownItemFormScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { key, itemId } = useLocalSearchParams<{
    key: string;
    itemId?: string;
  }>();
  const list = useDropdownList(key);
  const item = list.data?.items.find((i) => i.id === itemId);
  const save = useSaveItem(key, itemId);
  const toggle = useSaveItem(key, itemId);
  const remove = useDeleteItem(key, itemId ?? '');
  const [dialog, setDialog] = useState<Dialog>(null);

  const { control, handleSubmit, formState, reset } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { labelEs: '', labelEn: '' },
  });
  useEffect(() => {
    if (item) reset({ labelEs: item.labelEs, labelEn: item.labelEn });
  }, [item, reset]);

  const done = { onSuccess: () => router.back() };
  const closeOnError = { ...done, onError: () => setDialog(null) };
  const failure = [save, toggle, remove].find((m) => m.error)?.error;

  if (list.isPending)
    return <ActivityIndicator accessibilityLabel={t('common.loading')} />;
  if (list.isError)
    return (
      <EmptyState
        title={t('dropdowns.loadError')}
        description={errorMessage(t, list.error)}
        action={
          <Button
            label={t('common.tryAgain')}
            icon="restart"
            variant="tonal"
            onPress={() => list.refetch()}
          />
        }
      />
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
          {t(itemId ? 'dropdowns.editTitle' : 'dropdowns.createTitle')}
        </Text>
        {failure && dialog === null ? (
          <Banner message={errorMessage(t, failure)} />
        ) : null}
        {(['labelEs', 'labelEn'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <TextField
                label={t(`dropdowns.form.${name}`)}
                leadingIcon="list"
                onCard={false}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={
                  formState.errors[name]?.message
                    ? t(formState.errors[name].message)
                    : undefined
                }
              />
            )}
          />
        ))}
        <Button
          label={t('dropdowns.form.save')}
          icon="success"
          loading={save.isPending}
          onPress={handleSubmit((form) => save.mutate(form, done))}
        />
        {item?.status === 'ACTIVE' ? (
          <Button
            label={t('dropdowns.actions.deactivate')}
            icon="power"
            variant="tonal"
            onPress={() => setDialog('deactivate')}
          />
        ) : null}
        {item?.status === 'INACTIVE' ? (
          <Button
            label={t('dropdowns.actions.activate')}
            icon="activate"
            variant="tonal"
            loading={toggle.isPending}
            onPress={() => toggle.mutate({ status: 'ACTIVE' }, done)}
          />
        ) : null}
        {item ? (
          <Button
            label={t('dropdowns.actions.delete')}
            icon="trash"
            variant="outlined"
            disabled={item.inUse}
            helperText={t('dropdowns.rules.inUse')}
            onPress={() => setDialog('delete')}
          />
        ) : null}
      </ScrollView>

      {dialog === 'deactivate' ? (
        <ConfirmDialog
          title={t('dropdowns.confirm.deactivate.title')}
          message={t('dropdowns.confirm.deactivate.message')}
          confirmLabel={t('dropdowns.actions.deactivate')}
          confirmIcon="power"
          loading={toggle.isPending}
          onConfirm={() => toggle.mutate({ status: 'INACTIVE' }, closeOnError)}
          onCancel={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'delete' ? (
        <ConfirmDialog
          title={t('dropdowns.confirm.delete.title')}
          message={t('dropdowns.confirm.delete.message')}
          confirmLabel={t('dropdowns.actions.delete')}
          confirmIcon="trash"
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
});
