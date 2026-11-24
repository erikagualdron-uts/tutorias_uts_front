import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatDay, todayInBogota } from '@/date/day';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { useHolidays } from '../hooks/useHolidays';

// The calendar of days without tutoring. Past holidays are shown but cannot be changed.
export function HolidaysScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const thisYear = Number(todayInBogota().slice(0, 4));
  const [year, setYear] = useState(thisYear);
  const holidays = useHolidays(year);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('holidays.title')} count={holidays.data?.data.length} />
        <FilterChips
          options={[thisYear, thisYear + 1, thisYear + 2].map((y) => ({ value: String(y), label: String(y) }))}
          value={String(year)}
          onChange={(value) => value && setYear(Number(value))}
        />

        {holidays.isPending ? (
          <BrandLoader />
        ) : holidays.isError ? (
          <EmptyState
            title={t('holidays.loadError')}
            description={errorMessage(t, holidays.error)}
            action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => holidays.refetch()} />}
          />
        ) : holidays.data.data.length === 0 ? (
          <EmptyState title={t('holidays.empty.title')} description={t('holidays.empty.description')} />
        ) : (
          holidays.data.data.map((holiday) => (
            <Pressable
              key={holiday.id}
              accessibilityRole="button"
              accessibilityLabel={`${formatDay(holiday.date)} ${holiday.name}`}
              disabled={holiday.isPast}
              onPress={() => router.push({ pathname: '/more/holiday-form', params: { id: holiday.id, year: holiday.date.slice(0, 4) } })}
            >
              <Card style={styles.card}>
                <View style={styles.text}>
                  <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{holiday.name}</Text>
                  <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
                    {`${formatDay(holiday.date)} · ${t(`holidays.source.${holiday.source}`)}`}
                  </Text>
                </View>
                {holiday.isPast ? (
                  <View style={styles.badge}>
                    <Icon name="lock" size={16} color={palette.textSecondary} />
                    <Text style={[typography.label, { color: palette.textSecondary }]}>{t('holidays.past')}</Text>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          ))
        )}

        <Button label={t('holidays.add')} icon="add" onPress={() => router.push('/more/holiday-form')} />
        <Button label={t('holidays.import')} icon="importHolidays" variant="tonal" onPress={() => router.push('/more/holidays-import')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  text: { flex: 1, gap: spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
