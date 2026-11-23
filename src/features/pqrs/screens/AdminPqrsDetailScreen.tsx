import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { PqrsAdminDetail } from '@/api/types';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { TextAreaField } from '@/components/TextAreaField';
import { spacing, typography, usePalette } from '@/theme';
import { PqrsBody } from '../components/PqrsBody';
import { useAdminPqrsDetail, useResolvePqrs, useRespondPqrs, useReviewPqrs } from '../hooks/useAdminPqrs';
import { usePqrsLimits } from '../hooks/useAuthorPqrs';

// One PQRS for the CAE: the author, what they wrote, the replies and the actions of its state.
// A state that does not allow an action shows the rule instead of hiding it.
export function AdminPqrsDetailScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useAdminPqrsDetail(id);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {detail.isPending ? (
          <BrandLoader />
        ) : detail.isError ? (
          <EmptyState
            title={t('pqrs.detail.loadError')}
            description={errorMessage(t, detail.error)}
            action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => detail.refetch()} />}
          />
        ) : (
          <Content pqrs={detail.data} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Content({ pqrs }: { pqrs: PqrsAdminDetail }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const limits = usePqrsLimits().data;
  const review = useReviewPqrs(pqrs.id);
  const respond = useRespondPqrs(pqrs.id);
  const resolve = useResolvePqrs(pqrs.id);
  const [reply, setReply] = useState('');
  const [confirming, setConfirming] = useState(false);
  const failure = review.error ?? respond.error ?? resolve.error;
  const noReplies = pqrs.messages.length === 0;
  const send = () => respond.mutate({ body: reply }, { onSuccess: () => setReply('') });

  return (
    <>
      <Card style={styles.author}>
        <Text style={[typography.label, { color: palette.textSecondary }]}>{t('pqrs.admin.author')}</Text>
        <Text style={[typography.cardTitle, { color: palette.textPrimary }]}>
          {`${pqrs.author.firstName} ${pqrs.author.lastName} · ${t(`pqrs.admin.authorRole.${pqrs.author.role}`)}`}
        </Text>
        <Text style={[typography.bodySmall, { color: palette.textSecondary }]}>{pqrs.author.email}</Text>
      </Card>
      <PqrsBody pqrs={pqrs} />
      {failure ? <Banner message={errorMessage(t, failure)} severity="error" /> : null}

      {pqrs.status === 'FILED' ? (
        <>
          <Banner message={t('pqrs.admin.rule.reviewFirst')} />
          <Button label={t('pqrs.admin.review')} icon="clock" loading={review.isPending} onPress={() => review.mutate(undefined)} />
        </>
      ) : null}

      {pqrs.status === 'IN_REVIEW' ? (
        <>
          <TextAreaField
            label={t('pqrs.admin.reply')}
            leadingIcon="messages"
            onCard={false}
            value={reply}
            onChangeText={setReply}
            maxLength={limits?.responseMaxLength}
          />
          <Button
            label={t('pqrs.admin.sendReply')}
            icon="send"
            loading={respond.isPending}
            disabled={reply.trim().length === 0}
            onPress={send}
          />
          <Button
            label={t('pqrs.admin.resolve')}
            icon="success"
            variant="success"
            disabled={noReplies}
            helperText={noReplies ? t('pqrs.admin.rule.replyFirst') : undefined}
            onPress={() => setConfirming(true)}
          />
        </>
      ) : null}

      {pqrs.status === 'RESOLVED' ? <Banner message={t('pqrs.admin.rule.closed')} /> : null}

      {confirming ? (
        <ConfirmDialog
          title={t('pqrs.admin.resolveTitle')}
          message={t('pqrs.admin.resolveMessage')}
          confirmLabel={t('pqrs.admin.resolve')}
          confirmIcon="success"
          loading={resolve.isPending}
          onConfirm={() => resolve.mutate(undefined, { onSettled: () => setConfirming(false) })}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // 16 px between stacked buttons (docs/Design.md)
  content: { padding: spacing.lg, gap: spacing.lg },
  author: { gap: spacing.xs },
});
