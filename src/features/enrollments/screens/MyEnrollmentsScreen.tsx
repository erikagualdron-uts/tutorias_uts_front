import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EnrollmentItem } from '@/api/types';
import { errorMessage } from '@/api/errors';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { bogotaParts, scheduleLabel } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import { radius, spacing, typography, usePalette } from '@/theme';
import { useMyEnrollments } from '../hooks/useStudentModules';

function EnrollmentCard({ item }: { item: EnrollmentItem }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { module } = item;
  const day = (n: number) => t(`modules.daysShort.${n}`);
  const status = item.readOnly ? 'CLOSED' : item.status;
  const next = item.nextSession ? bogotaParts(item.nextSession.startsAt) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={module.name}
      onPress={() => router.push({ pathname: '/modules/[id]', params: { id: module.id } })}
    >
      <Card style={styles.card}>
        <View style={styles.title}>
          <Text numberOfLines={2} style={[typography.cardTitle, styles.name, { color: palette.textPrimary }]}>
            {module.name}
          </Text>
          <View style={[styles.badge, { borderColor: status === 'ACTIVE' ? palette.primary : palette.textSecondary }]}>
            <Text style={[typography.label, { color: status === 'ACTIVE' ? palette.primary : palette.textSecondary }]}>
              {t(`student.mine.status.${status}`)}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Icon name="teacher" size={16} color={palette.textSecondary} />
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
            {`${module.teacher.firstName} ${module.teacher.lastName}`}
          </Text>
        </View>
        <View style={styles.row}>
          <Icon name="schedule" size={16} color={palette.textSecondary} />
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
            {module.schedules.map((s) => scheduleLabel(s, day)).join(' · ')}
          </Text>
        </View>
        <View style={styles.row}>
          <Icon name="location" size={16} color={palette.textSecondary} />
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
            {t('student.modules.card.room', { room: module.room.name, location: module.room.location })}
          </Text>
        </View>
        <View style={styles.row}>
          <Icon name="session" size={16} color={palette.textPrimary} />
          <Text style={[typography.bodySmall, { color: palette.textPrimary }]}>
            {next ? t('student.mine.next', { date: next.date, time: next.time }) : t('student.mine.noNext')}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

// "My tutoring": the student's active enrollments, each opening its detail.
export function MyEnrollmentsScreen({ onBrowse }: { onBrowse: () => void }) {
  const { t } = useTranslation();
  const mine = useMyEnrollments('ACTIVE');

  if (mine.isPending) return <LoadingScreen />;
  if (mine.isError) {
    return (
      <EmptyState
        title={t('student.mine.loadError')}
        description={errorMessage(t, mine.error)}
        action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => mine.refetch()} />}
      />
    );
  }
  if (mine.data.data.length === 0) {
    return (
      <EmptyState
        title={t('student.mine.empty.title')}
        description={t('student.mine.empty.description')}
        action={<Button label={t('student.mine.empty.action')} icon="modules" onPress={onBrowse} />}
      />
    );
  }
  return (
    <View style={styles.list}>
      {mine.data.data.map((item) => (
        <EnrollmentCard key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  card: { gap: spacing.sm },
  title: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1 },
  badge: { borderWidth: 1, borderRadius: radius.badge, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
