import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { bogotaParts } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import { spacing, typography, usePalette } from '@/theme';
import { personName, type ChatMessage } from '../types';

// A teacher announcement is not a bubble: a full-width card with its label and the name of the teacher.
export function AnnouncementCard({ message }: { message: Pick<ChatMessage, 'body' | 'createdAt' | 'sender'> }) {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <Card style={[styles.card, { backgroundColor: palette.surfaceWarm }]}>
      <View style={styles.header}>
        <Icon name="notifications" size={18} color={palette.textPrimary} />
        <Text style={[typography.label, { color: palette.textPrimary }]}>{t('chat.announcement.label')}</Text>
        <Text style={[typography.metadata, { color: palette.textPrimary }]}>{`· ${personName(message.sender)}`}</Text>
      </View>
      <Text style={[typography.body, { color: palette.textPrimary }]}>{message.body}</Text>
      <Text style={[typography.metadata, styles.time, { color: palette.textPrimary }]}>{bogotaParts(message.createdAt).time}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  time: { alignSelf: 'flex-end' },
});
