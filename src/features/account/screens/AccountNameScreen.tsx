import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useSession } from '@/store/session';
import { spacing, usePalette } from '@/theme';
import { useUpdateOwnName } from '../hooks/useUpdateOwnName';
import { ownNameSchema, type OwnNameForm } from '../schemas';

// A student corrects their own name from "My account" (spec 033). The server decides who may.
export function AccountNameScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const user = useSession((state) => state.user);
  const update = useUpdateOwnName();
  const { control, handleSubmit, formState } = useForm<OwnNameForm>({
    resolver: zodResolver(ownNameSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' },
  });

  const submit = handleSubmit((form) => {
    if (form.firstName === user?.firstName && form.lastName === user?.lastName) {
      router.back();
      return;
    }
    update.mutate(form, {
      onSuccess: () =>
        router.replace({ pathname: '/(student)/account', params: { nameChanged: '1' } } as never),
    });
  });

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {update.error ? <Banner message={errorMessage(t, update.error)} severity="error" /> : null}
        {(['firstName', 'lastName'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <TextField
                leadingIcon="user"
                label={t(`account.name.${name}`)}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={formState.errors[name]?.message ? t(formState.errors[name].message) : undefined}
                autoComplete={name === 'firstName' ? 'given-name' : 'family-name'}
              />
            )}
          />
        ))}
        <Button
          label={t('account.name.submit')}
          icon="edit"
          loading={update.isPending}
          onPress={submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
