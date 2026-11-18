import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { formatDay } from '@/date/day';
import { calendarLayout, radius, spacing, typography, usePalette } from '@/theme';
import {
  blockPosition,
  isoWeekday,
  itemSpan,
  itemsOfDay,
  layoutOverlaps,
  nowOffset,
  rangeHeight,
  type HourRange,
} from './calendarMath';
import { hourLabel } from './DayTimeline';
import { NowLine } from './NowLine';
import { SessionBlock } from './SessionBlock';
import type { CalendarItem } from './types';

interface WeekGridProps {
  days: string[];
  items: CalendarItem[];
  range: HourRange;
  today: string;
  now: Date;
  onPressItem: (id: string) => void;
}

// The week in seven columns, scrolled sideways when they do not fit: compact blocks with hours, room and state.
export function WeekGrid({ days, items, range, today, now, onPressItem }: WeekGridProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { width } = useWindowDimensions();
  const fit = Math.floor((width - 2 * spacing.lg - calendarLayout.timeColumnWidth) / 7);
  const columnWidth = Math.max(calendarLayout.weekColumnWidth, fit);
  const hours = Array.from({ length: Math.max(0, (range.end - range.start) / 60) }, (_, i) => range.start + i * 60);
  const height = rangeHeight(range);

  return (
    <ScrollView nestedScrollEnabled style={styles.vertical}>
      <View style={styles.row}>
        <View style={{ width: calendarLayout.timeColumnWidth }}>
          <View style={{ height: calendarLayout.weekHeaderHeight }} />
          <View style={{ height }}>
            {hours.map((minute, i) => (
              <Text
                key={minute}
                style={[typography.metadata, styles.hourLabel, { top: i * calendarLayout.hourHeight, color: palette.textSecondary }]}
              >
                {hourLabel(minute)}
              </Text>
            ))}
          </View>
        </View>
        <ScrollView horizontal nestedScrollEnabled>
          {days.map((day) => {
            const dayItems = itemsOfDay(items, day);
            const layout = layoutOverlaps(dayItems);
            const isToday = day === today;
            const line = isToday ? nowOffset(now, range) : null;
            return (
              <View key={day} style={{ width: columnWidth }}>
                <View
                  style={[
                    styles.header,
                    { borderColor: isToday ? palette.primary : palette.border, borderWidth: isToday ? 2 : 1 },
                  ]}
                >
                  <Text style={[typography.label, { color: palette.textPrimary }]}>{t(`modules.daysShort.${isoWeekday(day)}`)}</Text>
                  <Text style={[typography.metadata, { color: palette.textSecondary }]}>{formatDay(day).slice(0, 5)}</Text>
                </View>
                <View style={{ height }}>
                  {hours.map((minute, i) => (
                    <View
                      key={minute}
                      style={[styles.rule, { top: i * calendarLayout.hourHeight, backgroundColor: palette.border }]}
                    />
                  ))}
                  {dayItems.map((item) => {
                    const slot = layout.get(item.id) ?? { column: 0, columns: 1 };
                    const { top, height: blockHeight } = blockPosition(itemSpan(item), range);
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.slot,
                          { top, height: blockHeight, left: `${(slot.column * 100) / slot.columns}%`, width: `${100 / slot.columns}%` },
                        ]}
                      >
                        <SessionBlock item={item} compact onPress={onPressItem} style={styles.fill} />
                      </View>
                    );
                  })}
                  {line === null ? null : <NowLine top={line} />}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  vertical: { maxHeight: calendarLayout.maxBodyHeight },
  row: { flexDirection: 'row' },
  header: {
    height: calendarLayout.weekHeaderHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
    marginHorizontal: spacing.xs,
  },
  hourLabel: { position: 'absolute', width: calendarLayout.timeColumnWidth },
  rule: { position: 'absolute', left: 0, right: 0, height: 1 },
  slot: { position: 'absolute', paddingHorizontal: spacing.xs },
  fill: { flex: 1 },
});
