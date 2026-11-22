import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/features/pqrs/components/StatusBadge';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { useRecentPqrs } from '../hooks/usePersonDashboard';
import { BlockState } from './BlockState';

// My latest PQRS (up to 3) with their state in text and icon.
export function MyPqrsBlock({ onOpen }: { onOpen?: (id: string) => void }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const query = useRecentPqrs();
  const items = query.data?.data ?? [];
  return (
    <BlockState query={query} emptyText={query.data && items.length === 0 ? t('dashboard.myPqrs.empty') : undefined}>
      <Card style={styles.card}>
        <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>{t('dashboard.myPqrs.title')}</Text>
        {items.map((pqrs) => (
          <Pressable
            key={pqrs.id}
            accessibilityRole={onOpen ? 'button' : undefined}
            accessibilityLabel={pqrs.subject}
            disabled={!onOpen}
            onPress={() => onOpen?.(pqrs.id)}
            style={styles.row}
          >
            <Text style={[typography.cardTitle, { color: palette.textPrimary }]} numberOfLines={1}>
              {pqrs.subject}
            </Text>
            <StatusBadge status={pqrs.status} />
          </Pressable>
        ))}
      </Card>
    </BlockState>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { gap: spacing.xs, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
});
