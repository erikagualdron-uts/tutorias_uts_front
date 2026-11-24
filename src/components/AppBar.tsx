import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/icons/Icon';
import { NotificationsBell } from '@/features/notifications/components/NotificationsBell';
import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { useSession } from '@/store/session';
import {
  MIN_TOUCH_TARGET,
  radius,
  useShadows,
  spacing,
  typography,
  usePalette,
} from '@/theme';

const BAR_HEIGHT = 56;

// Top bar of docs/Design.md: screen title on the left, avatar with the profile menu on the right.
export function AppBar({ title }: { title?: string }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const shadows = useShadows();
  const user = useSession((state) => state.user);
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const { top } = useSafeAreaInsets();

  const initials =
    (user?.firstName ?? user?.email ?? '?').charAt(0).toUpperCase() +
    (user?.lastName?.charAt(0).toUpperCase() ?? '');

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: palette.card }}>
      <View style={styles.bar}>
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          style={[
            typography.screenTitle,
            styles.title,
            { color: palette.textPrimary },
          ]}
        >
          {title}
        </Text>
        <NotificationsBell />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.menu')}
          onPress={() => setOpen(true)}
          style={styles.touch}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: palette.surface, borderColor: palette.textSecondary },
            ]}
          >
            <Text style={[typography.label, { color: palette.textPrimary }]}>
              {initials}
            </Text>
          </View>
        </Pressable>
      </View>

      <Modal
        transparent
        statusBarTranslucent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={[styles.backdrop, { paddingTop: top + BAR_HEIGHT - spacing.xs }]}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              styles.menu,
              shadows.level2,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
              },
            ]}
          >
            <Pressable
              accessibilityRole="menuitem"
              onPress={() => {
                setOpen(false);
                void signOut();
              }}
              style={[styles.item, { borderColor: palette.errorText }]}
            >
              <Icon name="signOut" color={palette.errorText} />
              <Text style={[typography.body, { color: palette.errorText }]}>
                {t('profile.signOut')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: BAR_HEIGHT,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { flex: 1 },
  touch: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: spacing.lg,
  },
  menu: {
    minWidth: 200,
    borderRadius: radius.input,
    borderWidth: 1,
  },
  item: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    margin: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.input,
  },
});
