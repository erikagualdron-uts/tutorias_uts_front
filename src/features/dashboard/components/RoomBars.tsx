import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography, usePalette } from '@/theme';
import type { AdminRooms, RoomUsage } from '../types';
import { CapacityBar } from './CapacityBar';

function Group({ title, rooms }: { title: string; rooms: RoomUsage[] }) {
  const { t } = useTranslation();
  const palette = usePalette();
  if (rooms.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={[typography.label, { color: palette.textSecondary }]}>{title}</Text>
      {rooms.map((room) => (
        <View key={room.roomId} style={styles.room}>
          <CapacityBar label={room.name} value={room.percent} max={100} valueText={`${room.percent} %`} />
          <Text style={[typography.metadata, { color: palette.textSecondary }]}>
            {t('dashboard.admin.rooms.detail', { location: room.location, count: room.modules })}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Horizontal bars of the most and the least occupied rooms.
export function RoomBars({ rooms }: { rooms: AdminRooms }) {
  const { t } = useTranslation();
  return (
    <View style={styles.box}>
      <Group title={t('dashboard.admin.rooms.most')} rooms={rooms.most} />
      <Group title={t('dashboard.admin.rooms.least')} rooms={rooms.least} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.lg },
  group: { gap: spacing.md },
  room: { gap: spacing.xs },
});
