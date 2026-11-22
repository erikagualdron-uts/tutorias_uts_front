import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { spacing, typography, usePalette } from '@/theme';
import { BlockState } from '../components/BlockState';
import { CapacityBar } from '../components/CapacityBar';
import { ChangeRow } from '../components/ChangeRow';
import { MetricCard } from '../components/MetricCard';
import { RoomBars } from '../components/RoomBars';
import { StatusStackBar } from '../components/StatusStackBar';
import { durationLabel } from '../format';
import { useAdminChanges, useAdminOverview, useAdminRooms } from '../hooks/useAdminDashboard';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

// The CAE's entry screen (spec 019): each block loads on its own and shows its own four states.
export function AdminDashboardScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
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
  const title = (key: string) => <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>{t(key)}</Text>;
  const data = overview.data;
  const pqrsTotal = data ? data.pqrs.filed + data.pqrs.inReview + data.pqrs.resolved : 0;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView
        testID="admin-dashboard"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <BlockState query={overview}>
          {data && (
            <>
              <Card style={styles.block}>
                {title('dashboard.admin.occupancy.title')}
                {data.modules.active === 0 ? (
                  <Text style={[typography.body, { color: palette.textSecondary }]}>{t('dashboard.admin.occupancy.empty')}</Text>
                ) : (
                  <>
                    <CapacityBar
                      large
                      label={t('dashboard.admin.occupancy.detail', { enrolled: data.occupancy.enrolled, capacity: data.occupancy.capacity })}
                      value={data.occupancy.enrolled}
                      max={data.occupancy.capacity}
                      valueText={`${data.occupancy.percent} %`}
                    />
                    <Text style={[typography.body, { color: palette.textSecondary }]}>
                      {`${t('dashboard.admin.occupancy.full', { count: data.modules.full })} · ${t('dashboard.admin.occupancy.low', { count: data.modules.lowEnrollment })}`}
                    </Text>
                  </>
                )}
              </Card>
              <View style={styles.pair}>
                <MetricCard value={data.modules.active} label={t('dashboard.admin.metrics.modules')} />
                <MetricCard value={data.accounts.students} label={t('dashboard.admin.metrics.students')} />
              </View>
              <View style={styles.pair}>
                <MetricCard value={data.accounts.teachers} label={t('dashboard.admin.metrics.teachers')} />
                <MetricCard value={data.pqrs.filed} label={t('dashboard.admin.metrics.filed')} />
              </View>
              <Card style={styles.block}>
                {title('dashboard.admin.pqrs.title')}
                {pqrsTotal === 0 ? (
                  <Text style={[typography.body, { color: palette.textSecondary }]}>{t('dashboard.admin.pqrs.empty')}</Text>
                ) : (
                  <StatusStackBar counts={{ FILED: data.pqrs.filed, IN_REVIEW: data.pqrs.inReview, RESOLVED: data.pqrs.resolved }} />
                )}
              </Card>
              <MetricCard value={durationLabel(t, data.pqrs.avgResponseSeconds)} label={t('dashboard.admin.pqrs.average')} />
            </>
          )}
        </BlockState>

        <BlockState query={changes} emptyText={changes.data?.data.length === 0 ? t('dashboard.admin.changes.empty') : undefined}>
          <Card style={styles.block}>
            {title('dashboard.admin.changes.title')}
            {changes.data?.data.map((change) => <ChangeRow key={change.sessionId} change={change} />)}
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
});
