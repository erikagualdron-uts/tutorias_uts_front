import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { bogotaParts } from '@/features/modules/format';
import { radius, spacing, typography, usePalette } from '@/theme';

const DAY_MS = 86_400_000;

// "Today", "Yesterday" or the date, in Bogota time, between two days of messages.
export function DateSeparator({ iso }: { iso: string }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const day = bogotaParts(iso).date;
  // Fixed when the separator appears: "Today" does not need to flip while it is on screen.
  const [now] = useState(Date.now);
  const label = day === bogotaParts(new Date(now).toISOString()).date ? t('chat.today') : day === bogotaParts(new Date(now - DAY_MS).toISOString()).date ? t('chat.yesterday') : day;
  return (
    <View style={styles.row}>
      <View style={[styles.chip, { backgroundColor: palette.surface }]}>
        <Text style={[typography.metadata, { color: palette.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', paddingVertical: spacing.sm },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
});
