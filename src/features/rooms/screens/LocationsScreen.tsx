import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { useLocations } from '../hooks/useRooms';

export function LocationsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const locations = useLocations();

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('locations.title')} count={locations.data?.data.length} />
        {locations.isPending ? (
          <BrandLoader />
        ) : locations.isError ? (
          <EmptyState
            title={t('locations.loadError')}
            description={errorMessage(t, locations.error)}
            action={
              <Button
                label={t('common.tryAgain')}
                icon="restart"
                variant="tonal"
                onPress={() => locations.refetch()}
              />
            }
          />
        ) : locations.data.data.length === 0 ? (
          <EmptyState
            title={t('locations.empty.title')}
            description={t('locations.empty.description')}
          />
        ) : (
          locations.data.data.map((location) => (
            <Pressable
              key={location.id}
              accessibilityRole="button"
              accessibilityLabel={location.name}
              onPress={() =>
                router.push({
                  pathname: '/modules/location-form',
                  params: { id: location.id },
                })
              }
            >
              <Card style={styles.card}>
                <Icon name="building" />
                <View style={styles.cardText}>
                  <Text
                    style={[
                      typography.cardTitle,
                      { color: palette.textPrimary },
                    ]}
                  >
                    {location.name}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: palette.textSecondary },
                    ]}
                  >
                    {t('locations.roomCounts', {
                      active: location.roomCounts?.active ?? 0,
                      inactive: location.roomCounts?.inactive ?? 0,
                    })}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
        <Button
          label={t('locations.create')}
          icon="add"
          onPress={() => router.push('/modules/location-form')}
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
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  cardText: { flex: 1, gap: spacing.xs },
});
