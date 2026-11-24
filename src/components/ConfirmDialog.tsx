import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';
import type { IconName } from '@/icons/registry';
import { radius, useShadows, spacing, typography, usePalette } from '@/theme';
import { Button, type ButtonVariant } from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmIcon: IconName;
  // Defaults to "Cancel"; a dialog that only offers something may say "Not now".
  cancelLabel?: string;
  loading?: boolean;
  // Severity of the confirm button: warning for reversible closures, destructive for deletions.
  variant?: Extract<ButtonVariant, 'primary' | 'warning' | 'destructive'>;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmation for destructive or far-reaching actions (docs/Design.md).
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmIcon,
  cancelLabel,
  loading = false,
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const shadows = useShadows();
  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            { backgroundColor: palette.card },
            shadows.level1,
          ]}
        >
          <Text
            style={[typography.sectionTitle, { color: palette.textPrimary }]}
          >
            {title}
          </Text>
          <Text style={[typography.body, { color: palette.textSecondary }]}>
            {message}
          </Text>
          <Button
            label={confirmLabel}
            icon={confirmIcon}
            variant={variant}
            loading={loading}
            onPress={onConfirm}
          />
          <Button
            label={cancelLabel ?? t('common.cancel')}
            icon="closeCircle"
            variant="outlined"
            disabled={loading}
            onPress={onCancel}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    borderRadius: radius.sheet,
    padding: spacing.xl,
    gap: spacing.lg,
  },
});
