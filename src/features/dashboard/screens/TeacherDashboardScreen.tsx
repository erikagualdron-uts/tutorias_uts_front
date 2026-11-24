import { useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { useChatUnread } from '@/features/chat/hooks/useChatData';
import { noticeTarget, targetFor } from '@/features/notifications/openTarget';
import { spacing, typography, usePalette, useRefreshColors } from '@/theme';
import { BlockState } from '../components/BlockState';
import { CapacityBar } from '../components/CapacityBar';
import { HeroSessionCard } from '../components/HeroSessionCard';
import { MetricCard } from '../components/MetricCard';
import { MyPqrsBlock } from '../components/MyPqrsBlock';
import { useTeacherDashboard } from '../hooks/usePersonDashboard';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

// The teacher's entry screen (spec 019): next session, week, unread messages, seats and my PQRS.
export function TeacherDashboardScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const refreshColors = useRefreshColors();
  const client = useQueryClient();
  const dashboard = useTeacherDashboard();
  const unread = useChatUnread();
  const [refreshing, setRefreshing] = useState(false);
  const refetchAll = useCallback(
    () => Promise.all([client.invalidateQueries({ queryKey: ['dashboard', 'teacher'] }), client.invalidateQueries({ queryKey: ['chat', 'unread'] }), client.invalidateQueries({ queryKey: ['pqrs', 'mine', 'recent'] })]),
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
      <ScrollView testID="teacher-dashboard" contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} {...refreshColors} />}>
        <BlockState query={dashboard}>
          {data && (
            <>
              <HeroSessionCard
                session={data.nextSession}
                onPress={data.nextSession ? () => router.push(targetFor('TEACHER', data.nextSession!.moduleId)) : undefined}
              />
              <View style={styles.pair}>
                <MetricCard value={data.weekSessions} label={t('dashboard.teacher.weekSessions')} />
                <MetricCard value={unread.data?.unread ?? '—'} label={t('dashboard.teacher.unreadMessages')} onPress={() => router.push('/(teacher)/messages' as Href)} />
              </View>
              {data.modules.length === 0 ? (
                <Card>
                  <Text style={[typography.body, { color: palette.textSecondary }]}>{t('dashboard.teacher.capacity.empty')}</Text>
                </Card>
              ) : (
                <Card style={styles.block}>
                  <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>{t('dashboard.teacher.capacity.title')}</Text>
                  {data.modules.map((m) => (
                    <CapacityBar key={m.id} label={m.name} value={m.enrolled} max={m.capacity} />
                  ))}
                </Card>
              )}
            </>
          )}
        </BlockState>
        <MyPqrsBlock
          onOpen={(id) => router.push(noticeTarget('TEACHER', { pqrsId: id }) as Href)}
          onSeeAll={() => router.push('/(teacher)/pqrs' as Href)}
        />
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
