import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { SearchField } from '@/components/SearchField';
import { useSession } from '@/store/session';
import { MIN_TOUCH_TARGET, spacing, typography, usePalette } from '@/theme';
import { useContacts, useCreateDirect } from '../hooks/useChatData';
import { personName } from '../types';
import { messagesBase } from './MessagesScreen';

const SEARCH_DELAY_MS = 300;

// Who I can write to: the server only lists people I may chat with. Picking one opens (or reuses) the conversation.
export function NewChatScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const role = useSession((s) => s.user?.role);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const contacts = useContacts(search);
  const create = useCreateDirect();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const open = (userId: string) =>
    create.mutate(userId, {
      onSuccess: (conversation) =>
        router.replace({ pathname: `${messagesBase(role)}/[id]`, params: { id: conversation.id } } as Href),
    });

  const list = contacts.data ?? [];
  const body = contacts.isPending ? (
    <BrandLoader />
  ) : contacts.isError ? (
    <EmptyState
      title={t('chat.new.loadError')}
      description={errorMessage(t, contacts.error)}
      action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => contacts.refetch()} />}
    />
  ) : (
    <EmptyState
      title={t(search ? 'chat.new.emptyFiltered.title' : 'chat.new.empty.title')}
      description={t(search ? 'chat.new.emptyFiltered.description' : 'chat.new.empty.description')}
    />
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <FlatList
        testID="chat-contacts"
        data={list}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={body}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[typography.screenTitle, { color: palette.textPrimary }]}>{t('chat.new.title')}</Text>
            {create.error ? <Banner message={errorMessage(t, create.error)} severity="error" /> : null}
            <SearchField
              label={t('chat.new.search')}
              onCard={false}
              value={text}
              onChangeText={setText}
              onClear={() => {
                setText('');
                setSearch('');
              }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={personName(item)} onPress={() => open(item.id)} style={styles.touch}>
            <Card style={styles.card}>
              <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>{personName(item)}</Text>
              <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>
                {[t(`chat.role.${item.role}`), ...item.modules].join(' · ')}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  touch: { minHeight: MIN_TOUCH_TARGET },
  card: { gap: spacing.xs },
});
