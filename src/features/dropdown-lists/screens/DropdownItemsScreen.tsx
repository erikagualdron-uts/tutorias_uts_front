import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { useDropdownList, useReorderItems } from '../hooks/useDropdownLists';
import { labelFor } from '../schemas';

export function DropdownItemsScreen() {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const { key } = useLocalSearchParams<{ key: string }>();
  const list = useDropdownList(key);
  const reorder = useReorderItems(key);
  const items = list.data?.items ?? [];

  // Moving swaps two neighbours and sends the full order (the server renumbers 1..n).
  const move = (index: number, delta: -1 | 1) => {
    const ids = items.map((item) => item.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    reorder.mutate(ids);
  };
  const arrow = (
    index: number,
    delta: -1 | 1,
    icon: IconName,
    name: string,
  ) => {
    const disabled = index + delta < 0 || index + delta >= items.length;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(
          delta < 0 ? 'dropdowns.moveUp' : 'dropdowns.moveDown',
          { name },
        )}
        accessibilityState={{ disabled }}
        disabled={disabled || reorder.isPending}
        onPress={() => move(index, delta)}
        style={styles.arrow}
      >
        <Icon
          name={icon}
          color={disabled ? palette.disabledText : palette.textPrimary}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>
          {list.data
            ? i18n.language.startsWith('en')
              ? list.data.nameEn
              : list.data.nameEs
            : t('dropdowns.title')}
        </Text>
        {reorder.error ? (
          <Banner message={errorMessage(t, reorder.error)} />
        ) : null}
        {list.isPending ? (
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        ) : list.isError ? (
          <EmptyState
            title={t('dropdowns.loadError')}
            description={errorMessage(t, list.error)}
            action={
              <Button
                label={t('common.tryAgain')}
                icon="restart"
                variant="tonal"
                onPress={() => list.refetch()}
              />
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={t('dropdowns.empty.title')}
            description={t('dropdowns.empty.description')}
          />
        ) : (
          items.map((item, index) => {
            const name = labelFor(item, i18n.language);
            return (
              <Card key={item.id} style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={name}
                  onPress={() =>
                    router.push({
                      pathname: '/more/dropdown-item-form',
                      params: { key, itemId: item.id },
                    })
                  }
                  style={styles.cardText}
                >
                  <Text
                    style={[
                      typography.cardTitle,
                      { color: palette.textPrimary },
                    ]}
                  >
                    {`${item.labelEs} / ${item.labelEn}`}
                  </Text>
                  <View style={styles.badge}>
                    <Icon
                      name={item.status === 'ACTIVE' ? 'activate' : 'power'}
                    />
                    <Text
                      style={[
                        typography.label,
                        { color: palette.textSecondary },
                      ]}
                    >
                      {t(`dropdowns.status.${item.status}`)}
                    </Text>
                  </View>
                </Pressable>
                {arrow(index, -1, 'arrowUp', name)}
                {arrow(index, 1, 'arrowDown', name)}
              </Card>
            );
          })
        )}
        <Button
          label={t('dropdowns.addItem')}
          icon="add"
          onPress={() =>
            router.push({
              pathname: '/more/dropdown-item-form',
              params: { key },
            })
          }
        />
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
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  arrow: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
