import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';
import type { IconName } from '@/icons/registry';
import { radius, shadows, spacing, typography, usePalette } from '@/theme';
import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmIcon: IconName;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmation for destructive or far-reaching actions (docs/Design.md).
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmIcon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const palette = usePalette();
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
            loading={loading}
            onPress={onConfirm}
          />
          <Button
            label={t('common.cancel')}
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
