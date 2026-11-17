import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import type { Session } from '@/api/types';
import { Icon } from '@/icons/Icon';
import { spacing, typography, usePalette } from '@/theme';
import { bogotaParts } from '../format';

// Date and time in Bogota; the state is always text plus icon, never only color.
export function SessionRow({ session }: { session: Session }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const start = bogotaParts(session.startsAt);
  const end = bogotaParts(session.endsAt);
  const cancelled = session.status === 'CANCELLED';
  const state = cancelled
    ? t(session.cancelReason === 'HOLIDAY' ? 'modules.session.holiday' : 'modules.session.CANCELLED')
    : t(`modules.session.${session.status}`);

  return (
    <View style={styles.row} accessibilityLabel={`${start.date} ${start.time} ${state}`}>
      <Text style={[typography.body, { color: palette.textPrimary }]}>
        {`${start.date} · ${start.time}–${end.time}`}
      </Text>
      <View style={styles.state}>
        <Icon name={cancelled ? 'error' : 'success'} size={16} color={cancelled ? palette.error : palette.primary} />
        <Text style={[typography.bodySmall, { color: cancelled ? palette.error : palette.textSecondary }]}>
          {state}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.sm },
  state: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
