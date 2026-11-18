import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/icons/Icon';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { useDropdownLists } from '../hooks/useDropdownLists';

export function DropdownListsScreen() {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const lists = useDropdownLists();

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {t('dropdowns.title')}
        </Text>
        {lists.isPending ? (
          <BrandLoader />
        ) : lists.isError ? (
          <EmptyState
            title={t('dropdowns.loadError')}
            description={errorMessage(t, lists.error)}
            action={
              <Button
                label={t('common.tryAgain')}
                icon="restart"
                variant="tonal"
                onPress={() => lists.refetch()}
              />
            }
          />
        ) : (
          lists.data.map((list) => {
            const name = i18n.language.startsWith('en')
              ? list.nameEn
              : list.nameEs;
            return (
              <Pressable
                key={list.key}
                accessibilityRole="button"
                accessibilityLabel={name}
                onPress={() =>
                  router.push({
                    pathname: '/more/dropdown-items',
                    params: { key: list.key },
                  })
                }
              >
                <Card style={styles.card}>
                  <Icon name="list" />
                  <View style={styles.cardText}>
                    <Text
                      style={[
                        typography.cardTitle,
                        { color: palette.textPrimary },
                      ]}
                    >
                      {name}
                    </Text>
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: palette.textSecondary },
                      ]}
                    >
                      {t('dropdowns.items', { count: list.itemCount })}
                    </Text>
                  </View>
                  <Icon name="chevronRight" color={palette.textSecondary} />
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  cardText: { flex: 1, gap: spacing.xs },
});
