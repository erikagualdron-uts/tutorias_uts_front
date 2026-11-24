import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SmtpStatus } from '@/api/types';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { radius, spacing, typography, usePalette } from '@/theme';
import { useSaveSmtp, useSmtpSettings, useSmtpTest } from '../hooks/useSmtp';
import { smtpSchema, type SmtpForm } from '../schemas';

const STATUS_ICON: Record<SmtpStatus, IconName> = {
  CONFIGURED: 'success',
  NOT_CONFIGURED: 'info',
  NEEDS_RECONFIGURATION: 'warning',
};

// Mail server settings of the CAE (spec 014, story 6). The password is write-only: the server never
// returns it, so the field starts empty and an empty one keeps the saved password.
export function SmtpSettingsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const settings = useSmtpSettings();
  const save = useSaveSmtp();
  const test = useSmtpTest();
  const [saved, setSaved] = useState(false);

  const data = settings.data;
  // A saved password can be kept only if there is one that can be read; otherwise it must be written.
  const keepsPassword = Boolean(data && data.hasPassword && data.status === 'CONFIGURED' && !data.usingEnvironment);
  const resolver = useMemo(() => zodResolver(smtpSchema(!keepsPassword)), [keepsPassword]);
  const { control, handleSubmit, formState, reset } = useForm<SmtpForm>({
    resolver,
    defaultValues: { host: '', port: '', user: '', password: '', from: '' },
  });
  useEffect(() => {
    if (data) reset({ host: data.host ?? '', port: data.port ? String(data.port) : '', user: data.user ?? '', password: '', from: data.from ?? '' });
  }, [data, reset]);

  if (settings.isPending) return <LoadingScreen />;
  if (settings.isError || !data) {
    return (
      <EmptyState
        title={t('smtp.loadError')}
        description={errorMessage(t, settings.error)}
        action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => settings.refetch()} />}
      />
    );
  }

  const fieldError = (name: keyof SmtpForm) => {
    const message = formState.errors[name]?.message;
    return message ? t(message) : undefined;
  };
  const textColor = data.status === 'CONFIGURED' ? palette.successText : data.status === 'NEEDS_RECONFIGURATION' ? palette.warningText : palette.textSecondary;
  const result = test.data;
  // Testing uses what is saved, so it needs a saved configuration of the CAE (not the environment's).
  const canTest = data.status === 'CONFIGURED';

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('smtp.title')}</Text>
        <Text style={[typography.body, { color: palette.textSecondary }]}>{t('smtp.intro')}</Text>

        <Card>
          <View style={[styles.badge, { borderColor: textColor }]} accessibilityRole="text">
            <Icon name={STATUS_ICON[data.status]} size={16} color={textColor} />
            <Text style={[typography.label, { color: textColor }]}>{t(`smtp.status.${data.status}`)}</Text>
          </View>
        </Card>

        {data.usingEnvironment ? <Banner message={t('smtp.environmentNotice')} /> : null}
        {data.status === 'NEEDS_RECONFIGURATION' ? <Banner message={t('smtp.reconfigureNotice')} severity="warning" /> : null}
        {save.isError ? <Banner message={errorMessage(t, save.error)} severity="error" /> : null}
        {saved && !save.isError ? <Banner message={t('smtp.form.saved')} severity="success" /> : null}

        <Controller
          control={control}
          name="host"
          render={({ field }) => (
            <TextField
              label={t('smtp.form.host')}
              leadingIcon="server"
              onCard={false}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError('host')}
            />
          )}
        />
        <Controller
          control={control}
          name="port"
          render={({ field }) => (
            <TextField
              label={t('smtp.form.port')}
              leadingIcon="server"
              onCard={false}
              keyboardType="number-pad"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError('port')}
            />
          )}
        />
        <Controller
          control={control}
          name="user"
          render={({ field }) => (
            <TextField
              label={t('smtp.form.user')}
              leadingIcon="user"
              onCard={false}
              autoCapitalize="none"
              autoCorrect={false}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError('user')}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label={t('smtp.form.password')}
              leadingIcon="key"
              password
              onCard={false}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={keepsPassword ? t('smtp.form.passwordKeep') : undefined}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError('password')}
            />
          )}
        />
        <Controller
          control={control}
          name="from"
          render={({ field }) => (
            <TextField
              label={t('smtp.form.from')}
              leadingIcon="email"
              onCard={false}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError('from')}
            />
          )}
        />

        <Button
          label={t('smtp.form.save')}
          icon="success"
          loading={save.isPending}
          onPress={handleSubmit((form) => {
            setSaved(false);
            test.reset();
            save.mutate(
              { ...form, port: Number(form.port) },
              { onSuccess: () => setSaved(true) },
            );
          })}
        />
        <Button
          label={t('smtp.test.action')}
          icon="send"
          variant="outlined"
          loading={test.isPending}
          disabled={!canTest}
          helperText={canTest ? undefined : t('smtp.test.needsSave')}
          onPress={() => test.mutate()}
        />
        {test.isError ? <Banner message={errorMessage(t, test.error)} severity="error" /> : null}
        {result ? (
          <Banner
            message={
              result.ok
                ? t('smtp.test.ok')
                : t('smtp.test.failed', { reason: t(`smtp.test.cause.${result.cause ?? 'UNKNOWN'}`) })
            }
            severity={result.ok ? 'success' : 'error'}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
