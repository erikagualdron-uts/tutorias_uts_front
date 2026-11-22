import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeroCard } from '@/components/HeroCard';
import { bogotaParts } from '@/features/modules/format';
import { onGradient, spacing, typography, usePalette } from '@/theme';
import type { NextSession } from '../types';

interface HeroSessionCardProps {
  session: NextSession | null;
  // Opens the module of the session; the button is only drawn when given.
  onPress?: () => void;
  // What the empty card offers (the student can explore modules).
  emptyHint?: string;
  emptyAction?: ReactNode;
}

// The next session on the brand gradient, or a soft card when there is none (docs/Design.md).
export function HeroSessionCard({ session, onPress, emptyHint, emptyAction }: HeroSessionCardProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  if (!session) {
    return (
      <Card style={[styles.empty, { backgroundColor: palette.surface }]}>
        <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>{t('dashboard.noUpcoming')}</Text>
        {emptyHint ? <Text style={[typography.body, { color: palette.textSecondary }]}>{emptyHint}</Text> : null}
        {emptyAction}
      </Card>
    );
  }
  const start = bogotaParts(session.startsAt);
  const end = bogotaParts(session.endsAt);
  return (
    <HeroCard style={styles.hero}>
      <View style={styles.title}>
        <Text style={[typography.label, styles.light]}>{t('dashboard.nextSession')}</Text>
        <View style={[styles.line, { backgroundColor: palette.accent }]} />
      </View>
      <Text style={[typography.sectionTitle, styles.light]}>{session.moduleName}</Text>
      <Text style={[typography.body, styles.light]}>{`${start.date} · ${start.time}–${end.time}`}</Text>
      <Text style={[typography.body, styles.light]}>
        {[
          t('dashboard.hero.room', { room: session.room }),
          session.attendees === undefined ? null : t('dashboard.hero.attendees', { count: session.attendees }),
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {onPress ? <Button label={t('dashboard.viewDetail')} icon="session" variant="accent" onPress={onPress} /> : null}
    </HeroCard>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm },
  title: { gap: spacing.xs, alignSelf: 'flex-start' },
  line: { height: 4, borderRadius: 2 },
  light: { color: onGradient.text },
  empty: { gap: spacing.sm },
});
