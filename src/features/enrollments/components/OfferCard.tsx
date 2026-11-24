import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { OfferState, StudentModule } from '@/api/types';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/icons/Icon';
import { radius, spacing, typography, usePalette } from '@/theme';
import { scheduleLabel } from '@/features/modules/format';

const LAST_SPOTS_RATIO = 0.8;

// What the badge and the bar say; the state is always text plus color, never only color.
export function offerLabelKey(module: StudentModule) {
  return module.state === 'BLOCKED' ? (module.blockReason ?? 'UNAVAILABLE') : module.state;
}

// The rule that blocks the action, as the text under the disabled button.
export function useBlockText(module: StudentModule) {
  const { t } = useTranslation();
  if (module.state === 'FULL') return t('student.modules.action.noSeats');
  if (module.state !== 'BLOCKED') return undefined;
  if (module.blockReason === 'SCHEDULE_CONFLICT' && module.conflict) {
    return t('student.modules.block.SCHEDULE_CONFLICT', {
      module: module.conflict.moduleName,
      day: t(`modules.days.${module.conflict.dayOfWeek}`),
      start: module.conflict.startTime,
      end: module.conflict.endTime,
    });
  }
  return t('student.modules.block.UNAVAILABLE');
}

interface OfferCardProps {
  module: StudentModule;
  // Opens the detail; omitted where the card already is the detail.
  onPress?: () => void;
  // The button; in the list it also opens the detail, where the enrollment is confirmed.
  onAction?: () => void;
  loading?: boolean;
}

// Module card for students (docs/Design.md "Module card (students)").
export function OfferCard({ module, onPress, onAction = onPress, loading = false }: OfferCardProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const day = (n: number) => t(`modules.daysShort.${n}`);
  const occupied = module.capacity - module.availableSeats;
  const ratio = module.capacity > 0 ? occupied / module.capacity : 1;
  const barColor = ratio >= 1 ? palette.textSecondary : ratio >= LAST_SPOTS_RATIO ? palette.warningText : palette.primary;
  const blockText = useBlockText(module);
  const closed = module.state === 'FULL' || module.state === 'BLOCKED';
  const badgeColor: Record<OfferState, string> = {
    AVAILABLE: palette.primary,
    LAST_SPOTS: palette.warningText,
    FULL: palette.textSecondary,
    ENROLLED: palette.link,
    BLOCKED: palette.errorText,
  };

  return (
    <Card style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={module.name} disabled={!onPress} onPress={onPress} style={styles.body}>
        <View style={styles.title}>
          <Text numberOfLines={2} style={[typography.cardTitle, styles.name, { color: palette.textPrimary }]}>
            {module.name}
          </Text>
          <View style={[styles.badge, { borderColor: badgeColor[module.state] }]}>
            <Text style={[typography.label, { color: badgeColor[module.state] }]}>
              {t(`student.modules.state.${offerLabelKey(module)}`)}
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
            {t('student.modules.card.weekly', {
              schedule: module.schedules.map((s) => scheduleLabel(s, day)).join(' · '),
            })}
          </Text>
        </View>
        <View style={styles.row}>
          <Icon name="location" size={16} color={palette.textSecondary} />
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
            {t('student.modules.card.room', { room: module.room.name, location: module.room.location })}
          </Text>
        </View>
        <Text style={[typography.bodySmall, { color: palette.textPrimary }]}>
          {t('student.modules.card.occupied', { occupied, capacity: module.capacity })}
        </Text>
        <View style={[styles.track, { backgroundColor: palette.border }]}>
          <View style={[styles.fill, { backgroundColor: barColor, width: `${Math.min(100, ratio * 100)}%` }]} />
        </View>
      </Pressable>
      {module.state === 'ENROLLED' ? (
        <Button label={t('student.modules.action.enrolled')} icon="enroll" variant="outlined" onPress={() => onAction?.()} />
      ) : (
        <Button
          label={t(module.state === 'FULL' ? 'student.modules.action.full' : 'student.modules.action.enroll')}
          icon={module.state === 'FULL' ? 'full' : 'enroll'}
          disabled={closed}
          loading={loading}
          helperText={blockText}
          onPress={() => onAction?.()}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  body: { gap: spacing.sm },
  title: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1 },
  badge: { borderWidth: 1, borderRadius: radius.badge, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  track: { height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 4 },
});
