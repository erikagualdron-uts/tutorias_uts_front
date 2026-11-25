import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Role } from '@/api/types';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ROLE_HOME } from '@/features/auth/routing';
import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { usePushPermission } from '@/features/notifications/hooks/usePushPermission';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { useSession } from '@/store/session';
import { spacing, typography, usePalette } from '@/theme';

const ROLE_ICON: Record<Role, IconName> = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  SUPERADMIN: 'user',
};

// "My account" (spec 032): read-only data of the session, push state, password change and sign out.
export function AccountScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const user = useSession((state) => state.user);
  const { passwordChanged, nameChanged } = useLocalSearchParams<{
    passwordChanged?: string;
    nameChanged?: string;
  }>();
  const push = usePushPermission();
  const signOut = useSignOut();
  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const row = (icon: IconName, label: string | null, value: string) => (
    <View style={styles.row} key={label ?? value}>
      <Icon name={icon} />
      <View style={styles.rowText}>
        {label ? (
          <Text style={[typography.label, { color: palette.textSecondary }]}>{label}</Text>
        ) : null}
        <Text style={[typography.body, { color: palette.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('account.title')} />
        {passwordChanged ? (
          <Banner message={t('account.password.success')} severity="success" />
        ) : null}
        {nameChanged ? <Banner message={t('account.name.success')} severity="success" /> : null}

        <Card style={styles.card}>
          {row('user', fullName ? t('account.fullName') : null, fullName || user.email)}
          {row('email', t('account.email'), user.email)}
          {row(ROLE_ICON[user.role], t('account.role'), t(`account.roles.${user.role}`))}
          {user.role === 'TEACHER' ? row('info', null, t('account.name.teacherRule')) : null}
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            <Icon name="notifications" />
            <View style={styles.rowText}>
              <Text style={[typography.label, { color: palette.textSecondary }]}>
                {t('account.notifications.title')}
              </Text>
              {push.state === 'granted' ? (
                <Text style={[typography.body, { color: palette.successText }]}>
                  {t('account.notifications.granted')}
                </Text>
              ) : push.state === 'undetermined' ? (
                <Text style={[typography.body, { color: palette.textPrimary }]}>
                  {t('account.notifications.undetermined')}
                </Text>
              ) : (
                <Text style={[typography.body, { color: palette.textSecondary }]}>
                  {t('account.notifications.blocked')}
                </Text>
              )}
            </View>
          </View>
          {push.state === 'undetermined' ? (
            <Button
              label={t('notifications.push.enable')}
              icon="notifications"
              variant="tonal"
              onPress={() => void push.enable()}
            />
          ) : null}
        </Card>

        {user.role === 'STUDENT' ? (
          <Button
            label={t('account.name.title')}
            icon="edit"
            variant="tonal"
            onPress={() => router.push('/(student)/account-name' as never)}
          />
        ) : null}
        <Button
          label={t('changePassword.submit')}
          icon="key"
          onPress={() => router.push(`${ROLE_HOME[user.role]}/account-password` as never)}
        />
        <Button
          label={t('profile.signOut')}
          icon="signOut"
          variant="destructive"
          onPress={() => void signOut()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1 },
});
