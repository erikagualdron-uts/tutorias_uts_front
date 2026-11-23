import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { SearchField } from '@/components/SearchField';
import { Icon } from '@/icons/Icon';
import {
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  typography,
  usePalette,
} from '@/theme';

export interface PickerOption {
  value: string;
  label: string;
  // A line under the label; with `disabled` it is the rule that blocks the option (docs/Design.md).
  hint?: string;
  disabled?: boolean;
}

interface PickerSheetProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  search?: { label: string; value: string; onChange: (value: string) => void };
  loading?: boolean;
  error?: string;
  emptyText: string;
}

// Bottom sheet that lists the options of a field (teacher, room, period, hour).
export function PickerSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  search,
  loading = false,
  error,
  emptyText,
}: PickerSheetProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        <View style={[styles.sheet, { backgroundColor: palette.card }]}>
          <Text
            accessibilityRole="header"
            style={[typography.sectionTitle, { color: palette.textPrimary }]}
          >
            {title}
          </Text>
          {search ? (
            <SearchField
              label={search.label}
              value={search.value}
              onChangeText={search.onChange}
              onClear={() => search.onChange('')}
            />
          ) : null}
          {error ? <Banner message={error} severity="error" /> : null}
          {loading ? (
            <BrandLoader />
          ) : options.length === 0 && !error ? (
            <Text style={[typography.body, { color: palette.textSecondary }]}>
              {emptyText}
            </Text>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(option) => option.value}
              style={styles.list}
              initialNumToRender={100}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.hint ? `${item.label}. ${item.hint}` : item.label
                  }
                  accessibilityState={{
                    selected: item.value === selected,
                    disabled: item.disabled,
                  }}
                  disabled={item.disabled}
                  onPress={() => onSelect(item.value)}
                  style={[styles.option, item.disabled && styles.disabled]}
                >
                  <View style={styles.optionText}>
                    <Text
                      style={[typography.body, { color: palette.textPrimary }]}
                    >
                      {item.label}
                    </Text>
                    {item.hint ? (
                      <Text
                        style={[
                          typography.bodySmall,
                          {
                            color: item.disabled
                              ? palette.errorText
                              : palette.textSecondary,
                          },
                        ]}
                      >
                        {item.hint}
                      </Text>
                    ) : null}
                  </View>
                  {item.value === selected ? (
                    <Icon name="activate" color={palette.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          )}
          <Button
            label={t('common.cancel')}
            icon="closeCircle"
            variant="tonal"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    gap: spacing.lg,
    maxHeight: '85%',
  },
  list: { flexGrow: 0 },
  option: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionText: { flex: 1, gap: spacing.xs },
  disabled: { opacity: 0.6 },
});
