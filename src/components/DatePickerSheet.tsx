import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  motion,
  radius,
  useShadows,
  spacing,
  typography,
  usePalette,
} from '@/theme';
import { Button } from './Button';
import { useMotion } from './useMotion';

interface DatePickerSheetProps {
  // The label of the field that opened the sheet.
  title: string;
  // Day the picker opens on; the sheet keeps its own draft until the person confirms.
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

// iOS bottom sheet for picking a day (docs/Design.md, Date fields). The system picker has no
// buttons of its own, so Confirm and Cancel live here: cancelling never changes the field.
export function DatePickerSheet({
  title,
  value,
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
}: DatePickerSheetProps) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const shadows = useShadows();
  const dark = useColorScheme() === 'dark';
  const { movement } = useMotion();
  const [draft, setDraft] = useState(value);

  const entering = movement
    ? FadeInDown.duration(motion.duration.sheet)
    : FadeIn.duration(motion.duration.press);

  return (
    <Modal transparent animationType="none" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        {/* Tapping outside cancels; screen readers use the Cancel button instead. */}
        <Pressable
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        />
        <Animated.View
          testID="date-picker-sheet"
          entering={entering}
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: palette.card },
            shadows.level1,
          ]}
        >
          <Text
            style={[typography.sectionTitle, { color: palette.textPrimary }]}
          >
            {title}
          </Text>
          <DateTimePicker
            mode="date"
            display="inline"
            value={draft}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            locale={i18n.language}
            themeVariant={dark ? 'dark' : 'light'}
            accentColor={palette.inputBorderFocus}
            onValueChange={(_event, date) => setDraft(date)}
          />
          <Button
            label={t('common.confirm')}
            icon="success"
            onPress={() => onConfirm(draft)}
          />
          <Button
            label={t('common.cancel')}
            icon="closeCircle"
            variant="outlined"
            onPress={onCancel}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
    gap: spacing.lg,
  },
});
