import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { TemporaryPasswordDialog } from '@/components/TemporaryPasswordDialog';
import { radius, spacing, typography, usePalette } from '@/theme';
import {
  useAccountAction,
  useAccountDetail,
  useRegeneratePassword,
} from '../hooks/useAccountActions';
import type { AccountKind } from '../hooks/useAccountList';
import { BajaDialog } from './BajaDialog';

interface AccountSheetProps {
  kind: AccountKind;
  id: string;
  onClose: () => void;
}

// Bottom sheet with the actions of one account. Closing or deleting asks first, with the effect in numbers.
export function AccountSheet({ kind, id, onClose }: AccountSheetProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const detail = useAccountDetail(kind, id);
  const act = useAccountAction(kind, id);
  const regenerate = useRegeneratePassword(id);
  // Lives only in this state: closing the dialog drops it for good.
  const [password, setPassword] = useState<string | null>(null);
  const [asking, setAsking] = useState<'deactivate' | 'delete' | null>(null);
  const account = detail.data;
  const count =
    account &&
    ('modulesCount' in account ? account.modulesCount : account.enrolledCount);

  const confirm = () => asking && act.mutate(asking, { onSuccess: onClose });
  const edit = () => {
    onClose();
    router.push({ pathname: '/more/teacher-edit', params: { id } });
  };
  const newPassword = () =>
    regenerate.mutate(undefined, {
      onSuccess: (r) => setPassword(r.temporaryPassword),
    });
  const reactivate = () => act.mutate('reactivate', { onSuccess: onClose });

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        <View style={[styles.sheet, { backgroundColor: palette.card }]}>
          {detail.isPending ? (
            <BrandLoader />
          ) : !account ? (
            <>
              <Banner
                message={`${t('accounts.sheetError')}. ${errorMessage(t, detail.error)}`}
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
              <Text
                accessibilityRole="header"
                style={[
                  typography.sectionTitle,
                  { color: palette.textPrimary },
                ]}
              >
                {`${account.firstName} ${account.lastName}`}
              </Text>
              <Text style={[typography.body, { color: palette.textSecondary }]}>
                {account.email}
              </Text>
              <Text style={[typography.label, { color: palette.textPrimary }]}>
                {t(`accounts.status.${account.status}`)}
              </Text>
              {(act.error && !asking) || regenerate.error ? (
                <Banner
                  message={errorMessage(t, regenerate.error ?? act.error)}
                  severity="error"
                />
              ) : null}
              {kind === 'teacher' ? (
                <>
                  <Button
                    label={t('accounts.actions.edit')}
                    icon="edit"
                    variant="tonal"
                    onPress={edit}
                  />
                  <Button
                    label={t('accounts.actions.regenerate')}
                    icon="key"
                    variant="tonal"
                    loading={regenerate.isPending}
                    disabled={account.status !== 'ACTIVE'}
                    helperText={
                      account.status !== 'ACTIVE'
                        ? t('accounts.regenerateBlocked')
                        : undefined
                    }
                    onPress={newPassword}
                  />
                </>
              ) : null}
              {account.status === 'ACTIVE' ? (
                <Button
                  label={t('accounts.actions.deactivate')}
                  icon="power"
                  variant="warning"
                  onPress={() => setAsking('deactivate')}
                />
              ) : (
                <Button
                  label={t('accounts.actions.reactivate')}
                  icon="activate"
                  variant="success"
                  loading={act.isPending}
                  onPress={reactivate}
                />
              )}
              <Button
                label={t('accounts.actions.delete')}
                icon="trash"
                variant="destructive"
                onPress={() => setAsking('delete')}
              />
            </>
          )}
          <Button
            label={t('common.cancel')}
            icon="closeCircle"
            variant="outlined"
            onPress={onClose}
          />
        </View>
      </View>
      {password ? (
        <TemporaryPasswordDialog
          password={password}
          onClose={() => {
            setPassword(null);
            onClose();
          }}
        />
      ) : null}
      {asking && account ? (
        <BajaDialog
          kind={kind}
          action={asking}
          count={count ?? 0}
          loading={act.isPending}
          error={act.error ? errorMessage(t, act.error) : undefined}
          onConfirm={confirm}
          onCancel={() => {
            act.reset();
            setAsking(null);
          }}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    gap: spacing.lg,
  },
});
