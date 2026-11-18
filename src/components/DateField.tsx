import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import {
  compareDays,
  dayToDate,
  formatDay,
  isValidDay,
  toDay,
  todayInBogota,
} from '@/date/day';
import type { IconName } from '@/icons/registry';
import { spacing, typography, usePalette } from '@/theme';
import { DatePickerSheet } from './DatePickerSheet';
import { FIELD_HEIGHT, FieldBox } from './FieldBox';

interface DateFieldProps {
  label: string;
  // A calendar day as YYYY-MM-DD, or '' when nothing is chosen.
  value: string;
  // Called only when the person confirms a day; it gets YYYY-MM-DD, with no time zone.
  onChange: (value: string) => void;
  placeholder: string;
  // First and last day that can be chosen, both inclusive.
  minDate?: string;
  maxDate?: string;
  // The rule behind the limits, in words; always visible under the field. An error replaces it.
  hint?: string;
  error?: string;
  disabled?: boolean;
  onCard?: boolean;
  leadingIcon?: IconName;
  // Called when the picker closes, so a form can mark the field as touched.
  onBlur?: () => void;
}

// The day the picker opens on: the current value, or today in Bogota, kept inside the limits.
function openingDay(value: string, minDate?: string, maxDate?: string): string {
  let day = isValidDay(value) ? value : todayInBogota();
  if (minDate && isValidDay(minDate) && compareDays(day, minDate) < 0)
    day = minDate;
  if (maxDate && isValidDay(maxDate) && compareDays(day, maxDate) > 0)
    day = maxDate;
  return day;
}

// A date is picked, never typed (D-079). It shows dd/mm/YYYY in every language.
export function DateField({
  label,
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  hint,
  error,
  disabled = false,
  onCard = true,
  leadingIcon = 'dateRange',
  onBlur,
}: DateFieldProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [active, setActive] = useState(false);
  const [opensOn, setOpensOn] = useState<Date>(new Date());

  const shown = formatDay(value);
  const close = () => {
    setActive(false);
    onBlur?.();
  };
  const choose = (date: Date) => {
    onChange(toDay(date));
    close();
  };

  const open = () => {
    if (disabled) return;
    const start = dayToDate(openingDay(value, minDate, maxDate)) as Date;
    setOpensOn(start);
    setActive(true);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: start,
        minimumDate: dayToDate(minDate ?? ''),
        maximumDate: dayToDate(maxDate ?? ''),
        onValueChange: (_event, date) => choose(date),
        onDismiss: close,
      });
    }
  };

  return (
    <>
      <FieldBox
        label={label}
        errorMessage={error}
        footer={
          hint && !error ? (
            <Text
              style={[
                typography.metadata,
                styles.hint,
                { color: palette.textSecondary },
              ]}
            >
              {hint}
            </Text>
          ) : undefined
        }
        leadingIcon={leadingIcon}
        focused={active}
        error={Boolean(error)}
        disabled={disabled}
        onCard={onCard}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: shown || t('dateField.empty') }}
          accessibilityHint={t('dateField.hint')}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={open}
          style={styles.press}
        >
          <Text
            numberOfLines={1}
            style={[
              typography.body,
              { color: shown ? palette.textPrimary : palette.inputPlaceholder },
            ]}
          >
            {shown || placeholder}
          </Text>
        </Pressable>
      </FieldBox>
      {active && Platform.OS === 'ios' ? (
        <DatePickerSheet
          title={label}
          value={opensOn}
          minimumDate={dayToDate(minDate ?? '')}
          maximumDate={dayToDate(maxDate ?? '')}
          onConfirm={choose}
          onCancel={close}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  press: { flex: 1, minHeight: FIELD_HEIGHT, justifyContent: 'center' },
  hint: { marginTop: spacing.xs },
});
