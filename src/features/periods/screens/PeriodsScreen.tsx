import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { Period, PeriodStatus } from '@/api/types';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatDay } from '@/date/day';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { usePeriods } from '../hooks/usePeriods';

const FILTERS: (PeriodStatus | undefined)[] = [
  undefined,
  'ACTIVE',
  'UPCOMING',
  'CLOSED',
];
// Status is never shown by color alone: each one has its own icon and label.
const STATUS_ICON: Record<PeriodStatus, IconName> = {
  ACTIVE: 'activate',
  UPCOMING: 'dateRange',
  CLOSED: 'lock',
};

export function PeriodsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const [status, setStatus] = useState<PeriodStatus | undefined>();
  const periods = usePeriods(status);

  const openForm = (period?: Period) =>
    router.push(
      period
        ? { pathname: '/more/period-form', params: { id: period.id } }
        : '/more/period-form',
    );

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('periods.title')} count={periods.data?.data.length} />
        <FilterChips
          options={FILTERS.map((value) => ({
            value,
            label: t(`periods.filter.${value ?? 'all'}`),
          }))}
          value={status}
          onChange={setStatus}
        />

        {periods.isPending ? (
          <BrandLoader />
        ) : periods.isError ? (
          <EmptyState
            title={t('periods.loadError')}
            description={errorMessage(t, periods.error)}
            action={
              <Button
                label={t('common.tryAgain')}
                icon="restart"
                variant="tonal"
                onPress={() => periods.refetch()}
              />
            }
          />
        ) : periods.data.data.length === 0 ? (
          <EmptyState
            title={t(
              status ? 'periods.emptyFiltered.title' : 'periods.empty.title',
            )}
            description={t(
              status
                ? 'periods.emptyFiltered.description'
                : 'periods.empty.description',
            )}
          />
        ) : (
          periods.data.data.map((period) => (
            <Pressable
              key={period.id}
              accessibilityRole="button"
              accessibilityLabel={period.name}
              onPress={() => openForm(period)}
            >
              <Card style={styles.card}>
                <View style={styles.cardText}>
                  <Text
                    style={[
                      typography.cardTitle,
                      { color: palette.textPrimary },
                    ]}
                  >
                    {period.name}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: palette.textSecondary },
                    ]}
                  >
                    {t('periods.range', {
                      start: formatDay(period.startsOn),
                      end: formatDay(period.endsOn),
                    })}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Icon name={STATUS_ICON[period.status]} />
                  <Text
                    style={[typography.label, { color: palette.textPrimary }]}
                  >
                    {t(`periods.status.${period.status}`)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}

        <Button
          label={t('periods.create')}
          icon="add"
          onPress={() => openForm()}
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
