import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StudentSession } from '@/api/types';
import { errorMessage } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BrandLoader } from '@/components/BrandLoader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { bogotaParts } from '@/features/modules/format';
import { spacing, typography, usePalette } from '@/theme';
import { CancelSheet } from '../components/CancelSheet';
import { OfferCard } from '../components/OfferCard';
import { SessionRow } from '../components/SessionRow';
import {
  useCancelModule,
  useCancelSession,
  useEnroll,
  useRestoreSession,
  useStudentModule,
} from '../hooks/useStudentModules';

// Detail of a module for the student: the card, the future sessions and, once enrolled, what can
// be cancelled. A closed period is history: read only, without actions.
export function StudentModuleDetailScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const module = useStudentModule(id);
  const enroll = useEnroll();
  const cancelModule = useCancelModule();
  const cancelSession = useCancelSession();
  const restoreSession = useRestoreSession();
  const [picked, setPicked] = useState<StudentSession | 'module' | null>(null);

  if (module.isPending) return <BrandLoader />;
  if (module.isError) {
    return (
      <EmptyState
        title={t('student.modules.loadError')}
        description={errorMessage(t, module.error)}
        action={<Button label={t('common.tryAgain')} icon="restart" variant="tonal" onPress={() => module.refetch()} />}
      />
    );
  }
  const m = module.data;
  const enrolled = m.state === 'ENROLLED';
  const failure = [enroll, cancelModule, cancelSession, restoreSession].find((mutation) => mutation.isError)?.error;
  const enrollmentId = m.enrollment?.id;
  const label = (s: StudentSession) => {
    const start = bogotaParts(s.startsAt);
    return `${start.date} · ${start.time}`;
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: palette.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {m.readOnly ? <Banner message={t('student.cancel.readOnly')} /> : null}
        {failure ? <Banner message={errorMessage(t, failure)} /> : null}
        <OfferCard
          module={m}
          loading={enroll.isPending}
          onAction={() => (enrolled ? undefined : enroll.mutate(m.id))}
        />
        {m.description ? (
          <Text style={[typography.body, { color: palette.textSecondary }]}>{m.description}</Text>
        ) : null}

        {m.readOnly ? null : (
          <Card style={styles.card}>
            <Text accessibilityRole="header" style={[typography.sectionTitle, { color: palette.textPrimary }]}>
              {t('student.modules.detail.sessions')}
            </Text>
            {m.sessions.length === 0 ? (
              <Text style={[typography.body, { color: palette.textSecondary }]}>{t('student.modules.detail.noSessions')}</Text>
            ) : (
              m.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  minutes={m.cancelLeadMinutes}
                  actions={enrolled}
                  restoring={restoreSession.isPending && restoreSession.variables?.sessionId === session.id}
                  onCancel={setPicked}
                  onRestore={(s) =>
                    enrollmentId && restoreSession.mutate({ enrollmentId, sessionId: s.id })
                  }
                />
              ))
            )}
          </Card>
        )}

        {enrolled && !m.readOnly ? (
          <Button label={t('student.cancel.action')} icon="unenroll" variant="outlined" onPress={() => setPicked('module')} />
        ) : null}
      </ScrollView>

      {picked && enrollmentId ? (
        <CancelSheet
          sessionLabel={picked === 'module' ? null : label(picked)}
          minutes={m.cancelLeadMinutes}
          loading={cancelSession.isPending || cancelModule.isPending}
          onClose={() => setPicked(null)}
          onSession={() =>
            picked !== 'module' &&
            cancelSession.mutate({ enrollmentId, sessionId: picked.id }, { onSettled: () => setPicked(null) })
          }
          onModule={() =>
            cancelModule.mutate(enrollmentId, {
              onSuccess: () => {
                setPicked(null);
                router.back();
              },
              onError: () => setPicked(null),
            })
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { gap: spacing.sm },
});
