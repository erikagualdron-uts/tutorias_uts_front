import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, IconButton } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { formatDay } from '@/date/day';
import { Icon } from '@/icons/Icon';
import { spacing, typography, usePalette } from '@/theme';
import { weekDaysOf } from './calendarMath';
import type { CalendarView } from './types';

interface CalendarHeaderProps {
  weekStart: string;
  canPrevious: boolean;
  canNext: boolean;
  // A blocked arrow still takes the press so the screen can say why it does not move.
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  view: CalendarView;
  onView: (view: CalendarView) => void;
  // True after pressing a blocked arrow: the week is the edge of the academic period.
  outsidePeriod: boolean;
}

// The week label, the arrows, the Today button and the Day / Week selector.
export function CalendarHeader({
  weekStart,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  onToday,
  view,
  onView,
  outsidePeriod,
}: CalendarHeaderProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const days = weekDaysOf(weekStart);
  const range = t('calendar.weekRange', { from: formatDay(days[0]), to: formatDay(days[6]) });

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <IconButton icon="chevronLeft" label={t('calendar.previousWeek')} blocked={!canPrevious} onPress={onPrevious} />
        <Text accessibilityRole="header" style={[typography.cardTitle, styles.range, { color: palette.textPrimary }]}>
          {range}
        </Text>
        <IconButton icon="chevronRight" label={t('calendar.nextWeek')} blocked={!canNext} onPress={onNext} />
      </View>
      <View style={styles.row}>
        <View style={styles.segmented}>
          <SegmentedControl<CalendarView>
            label={t('calendar.views')}
            value={view}
            onChange={onView}
            options={[
              { value: 'day', label: t('calendar.viewDay'), icon: 'list' },
              { value: 'week', label: t('calendar.viewWeek'), icon: 'dateRange' },
            ]}
          />
        </View>
        <Button label={t('calendar.today')} icon="today" variant="tonal" onPress={onToday} />
      </View>
      {outsidePeriod ? (
        <View accessibilityLiveRegion="polite" style={styles.notice}>
          <Icon name="info" size={16} color={palette.textSecondary} />
          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>{t('calendar.outsidePeriod')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  range: { flex: 1, textAlign: 'center' },
  segmented: { flex: 1 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center' },
});
