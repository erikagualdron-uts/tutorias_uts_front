import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ScheduleInput } from '@/api/types';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { SelectField } from '@/components/SelectField';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { EARLIEST_TIME, LATEST_TIME } from '../schemas';
import { PickerSheet } from './PickerSheet';

const DAYS = ['1', '2', '3', '4', '5', '6', '7'] as const;
// Hours are picked in steps of 15 minutes (a UI choice) inside the window a module may be held.
const TIMES = Array.from({ length: 96 }, (_, i) => {
  const minutes = i * 15;
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}).filter((time) => time >= EARLIEST_TIME && time <= LATEST_TIME);

export interface SlotErrors {
  startTime?: string;
  endTime?: string;
}

interface ScheduleEditorProps {
  value: ScheduleInput[];
  onChange: (next: ScheduleInput[]) => void;
  slotErrors?: (SlotErrors | undefined)[];
  // The rule that applies to the list as a whole (at least one, no overlap).
  error?: string;
  disabled?: boolean;
}

// The weekly slots of a module: day, start and end hour in America/Bogota time.
export function ScheduleEditor({
  value,
  onChange,
  slotErrors = [],
  error,
  disabled = false,
}: ScheduleEditorProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [picking, setPicking] = useState<{
    index: number;
    field: 'startTime' | 'endTime';
  } | null>(null);

  const update = (index: number, patch: Partial<ScheduleInput>) =>
    onChange(value.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));

  const current = picking ? value[picking.index]?.[picking.field] : undefined;

  return (
    <View style={styles.box}>
      <Text style={[typography.label, { color: palette.textPrimary }]}>
        {t('modules.form.schedules')}
      </Text>
      {value.map((slot, index) => (
        <Card key={index} style={styles.slot}>
          <View style={styles.slotHeader}>
            <Text style={[typography.label, { color: palette.textSecondary }]}>
              {t('modules.form.slotTitle', { number: index + 1 })}
            </Text>
            {value.length > 1 && !disabled ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('modules.form.removeSchedule', {
                  number: index + 1,
                })}
                onPress={() => onChange(value.filter((_, i) => i !== index))}
                style={styles.remove}
              >
                <Icon name="trash" color={palette.error} />
              </Pressable>
            ) : null}
          </View>
          <FilterChips
            options={DAYS.map((day) => ({
              value: day,
              label: t(`modules.daysShort.${day}`),
            }))}
            value={String(slot.dayOfWeek)}
            onChange={(day) => {
              if (!disabled && day) update(index, { dayOfWeek: Number(day) });
            }}
          />
          {(['startTime', 'endTime'] as const).map((field) => (
            <SelectField
              key={field}
              label={t(`modules.form.${field}`)}
              leadingIcon="clock"
              placeholder={t('modules.form.timePlaceholder')}
              value={slot[field] || undefined}
              error={slotErrors[index]?.[field]}
              disabled={disabled}
              onPress={() => setPicking({ index, field })}
            />
          ))}
        </Card>
      ))}
      {error ? (
        <Text accessibilityRole="alert" style={[typography.bodySmall, { color: palette.error }]}>
          {error}
        </Text>
      ) : null}
      {disabled ? null : (
        <Button
          label={t('modules.form.addSchedule')}
          icon="add"
          variant="tonal"
          onPress={() =>
            onChange([...value, { dayOfWeek: 1, startTime: '', endTime: '' }])
          }
        />
      )}

      <PickerSheet
        visible={picking !== null}
        title={t(
          picking?.field === 'endTime'
            ? 'modules.form.endTime'
            : 'modules.form.startTime',
        )}
        options={TIMES.map((time) => ({ value: time, label: time }))}
        selected={current}
        emptyText={t('modules.form.timePlaceholder')}
        onClose={() => setPicking(null)}
        onSelect={(time) => {
          if (picking) update(picking.index, { [picking.field]: time });
          setPicking(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.lg },
  slot: { gap: spacing.lg },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
  },
  remove: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
