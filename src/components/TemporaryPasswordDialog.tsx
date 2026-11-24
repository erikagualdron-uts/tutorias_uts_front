import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { radius, useShadows, spacing, typography, usePalette } from '@/theme';
import { Button } from './Button';

interface TemporaryPasswordDialogProps {
  password: string;
  onClose: () => void;
}

// Shown once after creating a teacher; the caller drops the password when this closes.
export function TemporaryPasswordDialog({
  password,
  onClose,
}: TemporaryPasswordDialogProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const shadows = useShadows();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(password);
    setCopied(true);
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        <View
          style={[
            styles.dialog,
            shadows.level3,
            { backgroundColor: palette.card },
          ]}
        >
          <Text
            style={[typography.sectionTitle, { color: palette.textPrimary }]}
          >
            {t('temporaryPassword.title')}
          </Text>
          <Text style={[typography.body, { color: palette.textSecondary }]}>
            {t('temporaryPassword.body')}
          </Text>
          <View style={[styles.block, { backgroundColor: palette.surface }]}>
            <Text
              selectable
              style={[typography.code, { color: palette.textPrimary }]}
            >
              {password}
            </Text>
          </View>
          <Text style={[typography.metadata, { color: palette.textSecondary }]}>
            {t('temporaryPassword.notice')}
          </Text>
          <Button
            label={
              copied
                ? t('temporaryPassword.copied')
                : t('temporaryPassword.copy')
            }
            icon="copy"
            variant="tonal"
            onPress={copy}
          />
          <Button
            label={t('temporaryPassword.close')}
            icon="success"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.hero,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  block: {
    borderRadius: radius.input,
    padding: spacing.lg,
    alignItems: 'center',
  },
});
