import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { RoomStatus } from '@/api/types';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { SearchField } from '@/components/SearchField';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { useLocations, useRooms } from '../hooks/useRooms';

const STATUSES: (RoomStatus | undefined)[] = [undefined, 'ACTIVE', 'INACTIVE'];

// Rooms live in the CAE "Modules" tab (docs/Context.md); locations are one tap away.
export function RoomsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState<string | undefined>();
  const [status, setStatus] = useState<RoomStatus | undefined>();
  const locations = useLocations();
  const rooms = useRooms({ search, locationId, status });
  const filtered = !!(search.trim() || locationId || status);

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('rooms.title')}
        </Text>
        <SearchField
          label={t('rooms.search')}
          onCard={false}
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
        />
        <FilterChips
          options={[
            { value: undefined, label: t('rooms.filter.allLocations') },
            ...(locations.data?.data ?? []).map((l) => ({
              value: l.id,
              label: l.name,
            })),
          ]}
          value={locationId}
          onChange={setLocationId}
        />
        <FilterChips
          options={STATUSES.map((value) => ({
            value,
            label: t(value ? `rooms.status.${value}` : 'rooms.filter.all'),
          }))}
          value={status}
          onChange={setStatus}
        />

        {rooms.isPending ? (
          <BrandLoader />
        ) : rooms.isError ? (
          <EmptyState
            title={t('rooms.loadError')}
            description={errorMessage(t, rooms.error)}
            action={
              <Button
                label={t('common.tryAgain')}
                icon="restart"
                variant="tonal"
                onPress={() => rooms.refetch()}
              />
            }
          />
        ) : rooms.data.data.length === 0 ? (
          <EmptyState
            title={t(
              filtered ? 'rooms.emptyFiltered.title' : 'rooms.empty.title',
            )}
            description={t(
              filtered
                ? 'rooms.emptyFiltered.description'
                : 'rooms.empty.description',
            )}
          />
        ) : (
          rooms.data.data.map((room) => (
            <Pressable
              key={room.id}
              accessibilityRole="button"
              accessibilityLabel={`${room.locationName} ${room.name}`}
              onPress={() =>
                router.push({
                  pathname: '/modules/room-form',
                  params: { id: room.id },
                })
              }
            >
              <Card style={styles.card}>
                <View style={styles.cardText}>
                  <Text
                    style={[
                      typography.cardTitle,
                      { color: palette.textPrimary },
                    ]}
                  >
                    {room.name}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: palette.textSecondary },
                    ]}
                  >
                    {`${room.locationName} · ${t('rooms.capacity', { count: room.capacity })}`}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Icon
                    name={room.status === 'ACTIVE' ? 'activate' : 'power'}
                  />
                  <Text
                    style={[typography.label, { color: palette.textPrimary }]}
                  >
                    {t(`rooms.status.${room.status}`)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}

        <Button
          label={t('rooms.create')}
          icon="add"
          onPress={() => router.push('/modules/room-form')}
        />
        <Button
          label={t('rooms.locationsLink')}
          icon="location"
          variant="tonal"
          onPress={() => router.push('/modules/locations')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  cardText: { flex: 1, gap: spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
