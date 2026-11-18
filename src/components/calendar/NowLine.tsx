import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { spacing, usePalette } from '@/theme';

const DOT = spacing.sm;
const LINE = 2;

// The line of the current hour (Bogota): 2 px with an 8 px dot, in the error color of the theme.
export function NowLine({ top }: { top: number }) {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <View
      accessible
      accessibilityLabel={t('calendar.now')}
      pointerEvents="none"
      style={[styles.row, { top: top - DOT / 2 }]}
    >
      <View style={[styles.dot, { backgroundColor: palette.error }]} />
      <View style={[styles.line, { backgroundColor: palette.error }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 0, right: 0, height: DOT, flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  line: { flex: 1, height: LINE },
});
