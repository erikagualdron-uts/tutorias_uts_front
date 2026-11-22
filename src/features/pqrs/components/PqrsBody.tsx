import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import type { PqrsDetail } from '@/api/types';
import { Card } from '@/components/Card';
import { labelFor } from '@/features/dropdown-lists/schemas';
import { bogotaParts } from '@/features/modules/format';
import { spacing, typography, usePalette } from '@/theme';
import { pqrsCode } from '../code';
import { StatusBadge } from './StatusBadge';

// What the author and the CAE both read of a PQRS: state, type, subject, description and the replies.
export function PqrsBody({ pqrs }: { pqrs: PqrsDetail }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const when = (iso: string) => {
    const { date, time } = bogotaParts(iso);
    return `${date} · ${time}`;
  };
  return (
    <>
      <StatusBadge status={pqrs.status} />
      <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{pqrs.subject}</Text>
      <Text style={[typography.code, { color: palette.textSecondary }]}>{t('pqrs.code', { code: pqrsCode(pqrs.id) })}</Text>
      <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
        {`${labelFor(pqrs.type, i18n.language)} · ${t('pqrs.list.filedOn', { date: bogotaParts(pqrs.createdAt).date })}`}
      </Text>
      <Card style={styles.card}>
        <Text style={[typography.label, { color: palette.textSecondary }]}>{t('pqrs.detail.description')}</Text>
        <Text style={[typography.body, { color: palette.textPrimary }]}>{pqrs.description}</Text>
      </Card>
      <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>{t('pqrs.detail.replies')}</Text>
      {pqrs.messages.length === 0 ? (
        <Text style={[typography.body, { color: palette.textSecondary }]}>{t('pqrs.detail.noReplies')}</Text>
      ) : (
        <View style={styles.replies}>
          {pqrs.messages.map((message) => (
            <Card key={message.id} style={styles.card}>
              <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>{when(message.createdAt)}</Text>
              <Text style={[typography.body, { color: palette.textPrimary }]}>{message.body}</Text>
            </Card>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  replies: { gap: spacing.md },
});
