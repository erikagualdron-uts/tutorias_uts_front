import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { Icon } from '@/icons/Icon';
import { calendarLayout, iconSize, spacing, typography, usePalette } from '@/theme';
import { blockPosition, itemSpan, layoutOverlaps, nowOffset, rangeHeight, type HourRange } from './calendarMath';
import { NowLine } from './NowLine';
import { SessionBlock } from './SessionBlock';
import type { CalendarItem } from './types';

interface DayTimelineProps {
  // The sessions of one day.
  items: CalendarItem[];
  range: HourRange;
  // The current instant when the day is today, so the line of the current hour is drawn; otherwise null.
  now: Date | null;
  onPressItem: (id: string) => void;
}

export const hourLabel = (minute: number): string => `${String(Math.floor(minute / 60)).padStart(2, '0')}:00`;

// The vertical timeline of one day: hour rows of 64, blocks placed by their hours, and the current hour line.
export function DayTimeline({ items, range, now, onPressItem }: DayTimelineProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const scroll = useRef<ScrollViewInstance>(null);
  const layout = layoutOverlaps(items);
  const first = items[0] ? blockPosition(itemSpan(items[0]), range).top : 0;
  const hours = Array.from({ length: Math.max(0, (range.end - range.start) / 60) }, (_, i) => range.start + i * 60);
  const line = now ? nowOffset(now, range) : null;

  // Opens on the first session of the day instead of the top of the hours.
  useEffect(() => {
    scroll.current?.scrollTo({ y: Math.max(0, first - spacing.sm), animated: false });
  }, [first]);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name="schedule" size={iconSize.empty} color={palette.textSecondary} />
        <Text style={[typography.body, { color: palette.textSecondary }]}>{t('calendar.noSessionsDay')}</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scroll} nestedScrollEnabled style={styles.scroll}>
      <View style={{ height: rangeHeight(range) }}>
        {hours.map((minute, i) => (
          <View key={minute} style={[styles.hour, { top: i * calendarLayout.hourHeight }]}>
            <Text style={[typography.metadata, styles.hourLabel, { color: palette.textSecondary }]}>{hourLabel(minute)}</Text>
            <View style={[styles.rule, { backgroundColor: palette.border }]} />
          </View>
        ))}
        <View style={styles.blocks}>
          {items.map((item) => {
            const slot = layout.get(item.id) ?? { column: 0, columns: 1 };
            const { top, height } = blockPosition(itemSpan(item), range);
            return (
              <View
                key={item.id}
                style={[
                  styles.slot,
                  { top, height, left: `${(slot.column * 100) / slot.columns}%`, width: `${100 / slot.columns}%` },
                ]}
              >
                <SessionBlock item={item} onPress={onPressItem} style={styles.fill} />
              </View>
            );
          })}
          {line === null ? null : <NowLine top={line} />}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: calendarLayout.maxBodyHeight },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  hour: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start' },
  hourLabel: { width: calendarLayout.timeColumnWidth },
  rule: { flex: 1, height: 1, marginTop: spacing.sm },
  blocks: { position: 'absolute', top: 0, bottom: 0, left: calendarLayout.timeColumnWidth, right: 0 },
  slot: { position: 'absolute', paddingRight: spacing.xs },
  fill: { flex: 1 },
});
