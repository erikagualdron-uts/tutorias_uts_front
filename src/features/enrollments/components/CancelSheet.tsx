import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { radius, spacing, typography, usePalette } from '@/theme';

interface CancelSheetProps {
  // The session picked in the detail; null when the sheet was opened to cancel the module.
  sessionLabel: string | null;
  minutes: number;
  loading?: boolean;
  onSession: () => void;
  onModule: () => void;
  onClose: () => void;
}

// Asks what to cancel: this session only or the whole module (D-070). Cancelling the module needs
// one more confirmation because it ends every session.
export function CancelSheet({ sessionLabel, minutes, loading = false, onSession, onModule, onClose }: CancelSheetProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [confirming, setConfirming] = useState(false);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        <View style={[styles.sheet, { backgroundColor: palette.card }]}>
          <Text accessibilityRole="header" style={[typography.sectionTitle, { color: palette.textPrimary }]}>
            {t('student.cancel.sheet.title')}
          </Text>
          {sessionLabel ? (
            <>
              <Text style={[typography.body, { color: palette.textSecondary }]}>
                {`${sessionLabel}. ${t('student.cancel.sheet.sessionRule', { minutes })}`}
              </Text>
              <Button
                label={t('student.cancel.scope.session')}
                icon="absent"
                variant="outlined"
                loading={loading}
                onPress={onSession}
              />
            </>
          ) : null}
          <Text style={[typography.body, { color: palette.textSecondary }]}>
            {t('student.cancel.sheet.moduleRule', { minutes })}
          </Text>
          <Button label={t('student.cancel.scope.module')} icon="unenroll" variant="outlined" onPress={() => setConfirming(true)} />
          <Button label={t('student.cancel.back')} icon="closeCircle" variant="tonal" onPress={onClose} />
        </View>
      </View>
      {confirming ? (
        <ConfirmDialog
          title={t('student.cancel.confirm.title')}
          message={t('student.cancel.confirm.message')}
          confirmLabel={t('student.cancel.confirm.action')}
          confirmIcon="unenroll"
          loading={loading}
          onConfirm={onModule}
          onCancel={() => setConfirming(false)}
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
