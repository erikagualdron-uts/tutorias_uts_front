import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { spacing, typography, usePalette } from '@/theme';

// The CAE "Modules" tab. The list of modules comes with the consultation story; the way into
// rooms and locations (spec 006) lives here as well.
export function ModulesScreen() {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('modules.title')}
        </Text>
        <EmptyState
          title={t('modules.empty.title')}
          description={t('modules.empty.description')}
        />
        <Button
          label={t('modules.create')}
          icon="add"
          onPress={() => router.push('/modules/module-form')}
        />
        <Button
          label={t('modules.roomsLink')}
          icon="building"
          variant="tonal"
          onPress={() => router.push('/modules/rooms')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
