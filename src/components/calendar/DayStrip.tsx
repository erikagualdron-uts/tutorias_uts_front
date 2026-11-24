import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDay } from '@/date/day';
import { MIN_TOUCH_TARGET, radius, spacing, typography, usePalette } from '@/theme';
import { isoWeekday } from './calendarMath';

interface DayStripProps {
  days: string[];
  selected: string;
  today: string;
  // Sessions of each day; a day with at least one gets the dot.
  counts: ReadonlyMap<string, number>;
  onSelect: (day: string) => void;
}

const DOT = spacing.sm;

// The seven days of the week: today has a ring, the selected day is filled, a dot marks days with sessions.
export function DayStrip({ days, selected, today, counts, onSelect }: DayStripProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const isSelected = day === selected;
        const isToday = day === today;
        const weekday = t(`modules.daysShort.${isoWeekday(day)}`);
        const count = counts.get(day) ?? 0;
        const has = count > 0;
        const color = isSelected ? palette.onPrimary : palette.textPrimary;
        const label = `${weekday} ${formatDay(day)}`;
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityLabel={[
              has ? t('calendar.day', { label, count }) : t('calendar.day_none', { label }),
              isToday ? t('calendar.isToday') : null,
              isSelected ? t('calendar.selected') : null,
            ]
              .filter(Boolean)
              .join(', ')}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(day)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? palette.primary : palette.card,
                borderColor: isToday || isSelected ? palette.primary : palette.controlBorder,
                borderWidth: isToday ? 2 : 1,
              },
            ]}
          >
            <Text style={[typography.label, { color }]}>{weekday}</Text>
            <Text style={[typography.cardTitle, { color }]}>{Number(day.slice(8))}</Text>
            <View style={[styles.dot, { backgroundColor: has ? (isSelected ? palette.onPrimary : palette.primary) : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET + spacing.xl,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
});
