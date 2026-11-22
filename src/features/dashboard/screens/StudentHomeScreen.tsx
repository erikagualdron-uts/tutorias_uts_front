import { useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useChatUnread } from '@/features/chat/hooks/useChatData';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';
import { spacing, typography, usePalette } from '@/theme';
import { BlockState } from '../components/BlockState';
import { ChangeRow } from '../components/ChangeRow';
import { HeroSessionCard } from '../components/HeroSessionCard';
import { MetricCard } from '../components/MetricCard';
import { MyPqrsBlock } from '../components/MyPqrsBlock';
import { useStudentDashboard } from '../hooks/usePersonDashboard';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

// The student's "Inicio" (spec 019): next session, week, unread alerts and messages, changes and my PQRS.
export function StudentHomeScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const client = useQueryClient();
  const dashboard = useStudentDashboard();
  const alerts = useUnreadCount();
  const messages = useChatUnread();
  const [refreshing, setRefreshing] = useState(false);
  const refetchAll = useCallback(
    () =>
      Promise.all(
        [['dashboard', 'student'], ['notifications', 'unread'], ['chat', 'unread'], ['pqrs', 'mine', 'recent']].map((queryKey) => client.invalidateQueries({ queryKey })),
      ),
    [client],
  );
  useRefreshOnFocus(refetchAll);
  const refresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };
  const data = dashboard.data;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView testID="student-home" contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <BlockState query={dashboard}>
          {data && (
            <>
              <HeroSessionCard
                session={data.nextSession}
                emptyHint={t('dashboard.student.noUpcomingHint')}
                emptyAction={<Button label={t('dashboard.student.explore')} icon="modules" variant="primary" onPress={() => router.push('/(student)/modules' as Href)} />}
              />
              <View style={styles.pair}>
                <MetricCard value={data.weekSessions} label={t('dashboard.student.weekSessions')} />
                <MetricCard value={alerts} label={t('dashboard.student.unreadAlerts')} />
              </View>
              <View style={styles.pair}>
                <MetricCard value={messages.data?.unread ?? '—'} label={t('dashboard.student.unreadMessages')} />
                <View style={styles.spacer} />
              </View>
              <Card style={styles.block}>
                <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>{t('dashboard.student.changes.title')}</Text>
                {data.changes.length === 0 ? (
                  <Text style={[typography.body, { color: palette.textSecondary }]}>{t('dashboard.student.changes.empty')}</Text>
                ) : (
                  data.changes.map((change) => <ChangeRow key={change.sessionId} change={change} />)
                )}
              </Card>
            </>
          )}
        </BlockState>
        <MyPqrsBlock />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  block: { gap: spacing.md },
  pair: { flexDirection: 'row', gap: spacing.lg },
  spacer: { flex: 1 },
});
