import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeroCard } from '@/components/HeroCard';
import { targetFor } from '@/features/notifications/openTarget';
import { onGradient, radius, spacing, typography, usePalette, useRefreshColors } from '@/theme';
import { BlockState } from '../components/BlockState';
import { CapacityBar } from '../components/CapacityBar';
import { ChangeRow } from '../components/ChangeRow';
import { MetricCard } from '../components/MetricCard';
import { RoomBars } from '../components/RoomBars';
import { StatusStackBar } from '../components/StatusStackBar';
import { durationLabel } from '../format';
import { useAdminChanges, useAdminOverview, useAdminRooms } from '../hooks/useAdminDashboard';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

// The CAE's entry screen (spec 019): each block loads on its own and shows its own four states.
export function AdminDashboardScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const refreshColors = useRefreshColors();
  const overview = useAdminOverview();
  const changes = useAdminChanges();
  const rooms = useAdminRooms();
  const [refreshing, setRefreshing] = useState(false);
  const { refetch: refetchOverview } = overview;
  const { refetch: refetchChanges } = changes;
  const { refetch: refetchRooms } = rooms;
  const refetchAll = useCallback(
    () => Promise.all([refetchOverview(), refetchChanges(), refetchRooms()]),
    [refetchOverview, refetchChanges, refetchRooms],
  );
  useRefreshOnFocus(refetchAll);

  const refresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };
  const go = (href: string | { pathname: string; params: Record<string, string> }) => router.push(href as Href);
  const title = (key: string) => <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>{t(key)}</Text>;
  const data = overview.data;
  const pqrsTotal = data ? data.pqrs.filed + data.pqrs.inReview + data.pqrs.resolved : 0;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView
        testID="admin-dashboard"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} {...refreshColors} />}
      >
        <BlockState query={overview}>
          {data && (
            <>
              <HeroCard style={styles.hero}>
                <View style={styles.heroTitle}>
                  <Text style={[typography.label, styles.onBrand]}>{t('dashboard.admin.occupancy.title')}</Text>
                  <View style={[styles.line, { backgroundColor: palette.accent }]} />
                </View>
                {data.modules.active === 0 ? (
                  <Text style={[typography.body, styles.onBrand]}>{t('dashboard.admin.occupancy.empty')}</Text>
                ) : (
                  <>
                    <Text style={[typography.metricNumber, styles.onBrand]}>{`${data.occupancy.enrolled} / ${data.occupancy.capacity}`}</Text>
                    <Text style={[typography.body, styles.onBrand]}>
                      {`${t('dashboard.admin.occupancy.full', { count: data.modules.full })} · ${t('dashboard.admin.occupancy.low', { count: data.modules.lowEnrollment })}`}
                    </Text>
                  </>
                )}
              </HeroCard>
              {data.modules.active > 0 && (
                <Card>
                  <CapacityBar
                    large
                    label={t('dashboard.admin.occupancy.detail', { enrolled: data.occupancy.enrolled, capacity: data.occupancy.capacity })}
                    value={data.occupancy.enrolled}
                    max={data.occupancy.capacity}
                    valueText={`${data.occupancy.percent} %`}
                  />
                </Card>
              )}
              <View style={styles.pair}>
                <MetricCard value={data.modules.active} label={t('dashboard.admin.metrics.modules')} onPress={() => go('/(admin)/modules')} />
                <MetricCard value={data.accounts.students} label={t('dashboard.admin.metrics.students')} onPress={() => go('/(admin)/more/students')} />
              </View>
              <View style={styles.pair}>
                <MetricCard value={data.accounts.teachers} label={t('dashboard.admin.metrics.teachers')} onPress={() => go('/(admin)/more/teachers')} />
                <MetricCard value={data.pqrs.filed} label={t('dashboard.admin.metrics.filed')} onPress={() => go({ pathname: '/(admin)/pqrs', params: { status: 'FILED' } })} />
              </View>
              <Card style={styles.block}>
                {title('dashboard.admin.pqrs.title')}
                {pqrsTotal === 0 ? (
                  <Text style={[typography.body, { color: palette.textSecondary }]}>{t('dashboard.admin.pqrs.empty')}</Text>
                ) : (
                  <StatusStackBar
                    counts={{ FILED: data.pqrs.filed, IN_REVIEW: data.pqrs.inReview, RESOLVED: data.pqrs.resolved }}
                    onSelect={(status) => go({ pathname: '/(admin)/pqrs', params: { status } })}
                  />
                )}
              </Card>
              <MetricCard value={durationLabel(t, data.pqrs.avgResponseSeconds)} label={t('dashboard.admin.pqrs.average')} />
            </>
          )}
        </BlockState>

        <BlockState query={changes} emptyText={changes.data?.data.length === 0 ? t('dashboard.admin.changes.empty') : undefined}>
          <Card style={styles.block}>
            {title('dashboard.admin.changes.title')}
            {changes.data?.data.map((change) => (
              <ChangeRow key={change.sessionId} change={change} onPress={() => go(targetFor('SUPERADMIN', change.moduleId) as never)} />
            ))}
            <Button label={t('dashboard.admin.changes.seeAll')} icon="list" variant="link" onPress={() => go('/(admin)/changes')} />
          </Card>
        </BlockState>

        <BlockState query={rooms} emptyText={rooms.data && rooms.data.most.length === 0 ? t('dashboard.admin.rooms.empty') : undefined}>
          <Card style={styles.block}>
            {title('dashboard.admin.rooms.title')}
            {rooms.data && <RoomBars rooms={rooms.data} />}
          </Card>
        </BlockState>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  block: { gap: spacing.md },
  pair: { flexDirection: 'row', gap: spacing.lg },
  hero: { gap: spacing.sm },
  heroTitle: { gap: spacing.xs, alignSelf: 'flex-start' },
  line: { height: 4, borderRadius: radius.line },
  onBrand: { color: onGradient.text },
});
