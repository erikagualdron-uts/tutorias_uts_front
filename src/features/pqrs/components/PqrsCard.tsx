import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { PqrsSummary } from '@/api/types';
import { Card } from '@/components/Card';
import { labelFor } from '@/features/dropdown-lists/schemas';
import { bogotaParts } from '@/features/modules/format';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { StatusBadge } from './StatusBadge';

// One PQRS of a list. `authorLine` is the author the CAE sees; the authors do not need it.
export function PqrsCard({ pqrs, authorLine, onPress }: { pqrs: PqrsSummary; authorLine?: string; onPress: () => void }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={pqrs.subject} onPress={onPress} style={styles.touch}>
      <Card style={styles.card}>
        <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{pqrs.subject}</Text>
        <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
          {`${labelFor(pqrs.type, i18n.language)} · ${t('pqrs.list.filedOn', { date: bogotaParts(pqrs.createdAt).date })}`}
        </Text>
        {authorLine ? <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>{authorLine}</Text> : null}
        <StatusBadge status={pqrs.status} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { minHeight: MIN_TOUCH_TARGET },
  card: { gap: spacing.xs },
});
