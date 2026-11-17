import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Module } from '@/api/types';
import { Card } from '@/components/Card';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { scheduleLabel } from '../format';

export function ModuleCard({ module }: { module: Module }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const day = (n: number) => t(`modules.daysShort.${n}`);
  const notices = [
    module.teacherUnavailable && t('modules.unavailable.teacher'),
    module.roomUnavailable && t('modules.unavailable.room'),
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={module.name}
      onPress={() => router.push({ pathname: '/modules/[id]', params: { id: module.id } })}
    >
      <Card style={styles.card}>
        <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{module.name}</Text>
        <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
          {`${module.teacher.firstName} ${module.teacher.lastName} · ${module.room.locationName} ${module.room.name}`}
        </Text>
        <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
          {module.schedules.map((s) => scheduleLabel(s, day)).join(' · ')}
        </Text>
        <View style={styles.row}>
          <Icon name="capacity" size={16} color={palette.textSecondary} />
          <Text style={[typography.label, { color: palette.textPrimary }]}>
            {t('modules.card.cupo', { enrolled: module.enrolled, capacity: module.capacity })}
          </Text>
        </View>
        {notices.map((text) => (
          <View key={String(text)} style={styles.row}>
            <Icon name="warning" size={16} color={palette.error} />
            <Text style={[typography.bodySmall, { color: palette.error }]}>{text}</Text>
          </View>
        ))}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs, minHeight: MIN_TOUCH_TARGET },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
