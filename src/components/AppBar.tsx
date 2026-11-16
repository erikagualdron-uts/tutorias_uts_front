import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { useSession } from '@/store/session';
import {
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  typography,
  usePalette,
} from '@/theme';

// Top bar of docs/Design.md: screen title on the left, avatar with the profile menu on the right.
export function AppBar({ title }: { title?: string }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const user = useSession((state) => state.user);
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);

  const initials =
    (user?.firstName ?? user?.email ?? '?').charAt(0).toUpperCase() +
    (user?.lastName?.charAt(0).toUpperCase() ?? '');

  return (
    <SafeAreaView
      edges={['top']}
      style={{ backgroundColor: palette.background }}
    >
      <View style={[styles.bar, { borderBottomColor: palette.border }]}>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.menu')}
          onPress={() => setOpen(true)}
          style={styles.touch}
        >
          <View style={[styles.avatar, { backgroundColor: palette.surface }]}>
            <Text style={[typography.label, { color: palette.textPrimary }]}>
              {initials}
            </Text>
          </View>
        </Pressable>
      </View>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              {
                backgroundColor: palette.background,
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
              style={styles.item}
            >
              <Text style={[typography.body, { color: palette.textPrimary }]}>
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
    minHeight: 56,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 96,
    paddingRight: spacing.lg,
  },
  menu: {
    minWidth: 200,
    borderRadius: radius.input,
    borderWidth: 1,
    elevation: 4,
  },
  item: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
