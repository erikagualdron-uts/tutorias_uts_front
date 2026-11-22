import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AccountStatus } from '@/api/types';
import { Card } from '@/components/Card';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';

interface AccountCardProps {
  name: string;
  email: string;
  status: AccountStatus;
  countLabel: string;
  onPress: () => void;
}

// State is always text plus icon, never color alone.
export function AccountCard({
  name,
  email,
  status,
  countLabel,
  onPress,
}: AccountCardProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const active = status === 'ACTIVE';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
    >
      <Card style={styles.card}>
        <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>
          {name}
        </Text>
        <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
          {email}
        </Text>
        <View style={styles.row}>
          <Icon
            name={active ? 'success' : 'power'}
            size={16}
            color={active ? palette.success : palette.textSecondary}
          />
          <Text style={[typography.label, { color: palette.textPrimary }]}>
            {t(`accounts.status.${status}`)}
          </Text>
          <Text
            style={[typography.bodySmall, { color: palette.textSecondary }]}
          >{`· ${countLabel}`}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs, minHeight: MIN_TOUCH_TARGET },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
