import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { spacing, usePalette } from '@/theme';

// Entry points of the CAE "More" tab; Students and Settings arrive with their features.
export function MoreScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <Button
        label={t('more.createTeacher')}
        variant="tonal"
        onPress={() => router.push('/more/create-teacher')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, padding: spacing.lg } });
