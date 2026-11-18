import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { formatDay, todayInBogota } from '@/date/day';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { useImportHolidays, useImportPreview } from '../hooks/useHolidays';

// The list comes from the holidays service through the API; nothing is saved until it is confirmed.
// If the service is down the manual calendar is one button away.
export function HolidaysImportScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const thisYear = Number(todayInBogota().slice(0, 4));
  const [year, setYear] = useState(thisYear + 1);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const preview = useImportPreview(year);
  const run = useImportHolidays();
  const [done, setDone] = useState<{ created: number; skipped: number; cancelledSessions: number } | null>(null);

  const toggle = (date: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (!next.delete(date)) next.add(date);
      return next;
    });

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('holidays.import')}</Text>

        {done ? (
          <>
            <Banner message={t('holidays.importResult.created', { count: done.created })} />
            {done.skipped > 0 ? <Banner message={t('holidays.importResult.skipped', { count: done.skipped })} /> : null}
            {done.cancelledSessions > 0 ? (
              <Banner message={t('holidays.result.cancelled', { count: done.cancelledSessions })} />
            ) : null}
            <Button label={t('modules.result.done')} icon="success" onPress={() => router.back()} />
          </>
        ) : (
          <>
            <FilterChips
              options={[thisYear, thisYear + 1, thisYear + 2].map((y) => ({ value: String(y), label: String(y) }))}
              value={String(year)}
              onChange={(value) => {
                if (!value) return;
                setYear(Number(value));
                setChosen(new Set());
              }}
            />
            {run.error ? <Banner message={errorMessage(t, run.error)} /> : null}

            {preview.isPending ? (
              <BrandLoader />
            ) : preview.isError ? (
              <>
                <Banner message={errorMessage(t, preview.error)} />
                <Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => preview.refetch()} />
                <Button label={t('holidays.addByHand')} icon="add" variant="tonal" onPress={() => router.replace('/more/holiday-form')} />
              </>
            ) : (
              <>
                {preview.data.data.map((entry) => {
                  const blocked = entry.alreadyExists || entry.isPast;
                  const selected = chosen.has(entry.date);
                  const reason = entry.alreadyExists ? t('holidays.preview.exists') : entry.isPast ? t('holidays.past') : undefined;
                  return (
                    <Pressable
                      key={entry.date}
                      accessibilityRole="checkbox"
                      accessibilityLabel={`${formatDay(entry.date)} ${entry.name}`}
                      accessibilityState={{ checked: selected, disabled: blocked }}
                      disabled={blocked}
                      onPress={() => toggle(entry.date)}
                    >
                      <Card style={[styles.card, blocked && styles.blocked]}>
                        <Icon name={selected ? 'checkboxOn' : 'checkboxOff'} color={selected ? palette.primary : palette.textSecondary} />
                        <View style={styles.text}>
                          <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{entry.name}</Text>
                          <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
                            {reason ? `${formatDay(entry.date)} · ${reason}` : formatDay(entry.date)}
                          </Text>
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
                <Button
                  label={t('holidays.preview.confirm', { count: chosen.size })}
                  icon="importHolidays"
                  disabled={chosen.size === 0}
                  loading={run.isPending}
                  onPress={() => run.mutate({ year, dates: [...chosen] }, { onSuccess: setDone })}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  blocked: { opacity: 0.6 },
  text: { flex: 1, gap: spacing.xs },
});
