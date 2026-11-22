import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, radius, spacing, typography, usePalette } from '@/theme';
import type { MessageKind } from '../types';

const MAX_LINES = 5;

interface ComposerProps {
  maxLength: number;
  // Only the teacher of the module can publish an announcement.
  canAnnounce: boolean;
  onSend: (body: string, kind: MessageKind) => void;
}

// Where a message is written. "Send" is disabled while the text is empty; the counter shows the limit.
export function Composer({ maxLength, canAnnounce, onSend }: ComposerProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<MessageKind>('TEXT');
  const body = text.trim();

  const send = () => {
    if (!body) return;
    onSend(body, kind);
    setText('');
  };

  return (
    <View style={styles.box}>
      {canAnnounce ? (
        <SegmentedControl
          label={t('chat.composer.kind')}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'TEXT', label: t('chat.composer.asMessage'), icon: 'messages' },
            { value: 'ANNOUNCEMENT', label: t('chat.composer.asAnnouncement'), icon: 'notifications' },
          ]}
        />
      ) : null}
      <View style={styles.row}>
        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          maxLength={maxLength}
          accessibilityLabel={t('chat.composer.label')}
          placeholder={t('chat.composer.label')}
          placeholderTextColor={palette.inputPlaceholder}
          style={[typography.body, styles.input, { color: palette.textPrimary, backgroundColor: palette.inputFillOnScreen, borderColor: palette.inputBorder }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.composer.send')}
          accessibilityState={{ disabled: !body }}
          disabled={!body}
          onPress={send}
          style={[styles.send, { backgroundColor: palette.primary, opacity: body ? 1 : 0.6 }]}
        >
          <Icon name="send" size={20} color={palette.onPrimary} />
        </Pressable>
      </View>
      <Text style={[typography.metadata, styles.counter, { color: palette.textSecondary }]}>
        {text.length}/{maxLength}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    maxHeight: typography.body.lineHeight * MAX_LINES + spacing.xl,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  send: { width: MIN_TOUCH_TARGET, height: MIN_TOUCH_TARGET, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  counter: { textAlign: 'right' },
});
