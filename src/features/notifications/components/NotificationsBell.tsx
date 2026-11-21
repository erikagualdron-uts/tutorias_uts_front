import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/icons/Icon';
import { useSession } from '@/store/session';
import { MIN_TOUCH_TARGET, iconSize, typography, usePalette } from '@/theme';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { inboxRoute } from '../openTarget';

const MAX_SHOWN = 99;

// The bell of the app bar with the unread counter (docs/Design.md: error-red badge with a white number).
export function NotificationsBell() {
  const { t } = useTranslation();
  const palette = usePalette();
  const role = useSession((state) => state.user?.role);
  const unread = useUnreadCount();
  if (!role) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? t('notifications.bellUnread', { count: unread }) : t('notifications.bell')}
      onPress={() => router.push(inboxRoute(role))}
      style={styles.touch}
    >
      <Icon name="notifications" active={unread > 0} size={iconSize.nav} color={palette.textPrimary} />
      {unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: palette.error }]}>
          <Text style={[typography.label, styles.count, { color: palette.onPrimary }]}>
            {unread > MAX_SHOWN ? `${MAX_SHOWN}+` : String(unread)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { width: MIN_TOUCH_TARGET, height: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { fontSize: 10, lineHeight: 14 },
});
