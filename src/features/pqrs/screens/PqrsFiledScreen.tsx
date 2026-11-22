import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PqrsStatus } from '@/api/types';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { bogotaParts } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import { useSession } from '@/store/session';
import { spacing, typography, usePalette } from '@/theme';
import { StatusBadge } from '../components/StatusBadge';
import { pqrsCode } from '../code';

// What the author sees right after filing: the number to quote, the date and the state (spec 020).
// It reads what the server answered from the route params, so it needs no new request.
export function PqrsFiledScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id, createdAt, status } = useLocalSearchParams<{ id: string; createdAt: string; status: PqrsStatus }>();
  const base = useSession((state) => (state.user?.role === 'TEACHER' ? '/(teacher)/pqrs' : '/(student)/pqrs'));
  const { date, time } = bogotaParts(createdAt);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Icon name="success" size={48} color={palette.success} />
          <Text style={[typography.screenTitle, styles.center, { color: palette.textPrimary }]}>{t('pqrs.filed.title')}</Text>
          <Text style={[typography.body, styles.center, { color: palette.textSecondary }]}>{t('pqrs.filed.hint')}</Text>
        </View>
        <Card style={styles.card}>
          <Text style={[typography.label, { color: palette.textSecondary }]}>{t('pqrs.filed.number')}</Text>
          <Text style={[typography.code, styles.number, { color: palette.textPrimary }]}>{pqrsCode(id)}</Text>
          <Text style={[typography.label, { color: palette.textSecondary }]}>{t('pqrs.filed.date')}</Text>
          <Text style={[typography.body, { color: palette.textPrimary }]}>{`${date} · ${time}`}</Text>
          <StatusBadge status={status} />
        </Card>
        <Button
          label={t('pqrs.filed.view')}
          icon="pqrs"
          onPress={() => router.push({ pathname: `${base}/[id]`, params: { id } } as Href)}
        />
        <Button label={t('pqrs.filed.back')} icon="back" variant="outlined" onPress={() => router.replace(base as Href)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  card: { gap: spacing.sm },
  number: { fontSize: 28, lineHeight: 36 },
});
