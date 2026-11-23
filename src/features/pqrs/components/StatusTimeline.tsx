import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import type { PqrsStatus } from '@/api/types';
import { bogotaParts } from '@/features/modules/format';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { spacing, typography, usePalette } from '@/theme';
import { timelineSteps } from '../timeline';

const ICONS: Record<PqrsStatus, IconName> = { FILED: 'pqrs', IN_REVIEW: 'clock', RESOLVED: 'success' };

interface StatusTimelineProps {
  status: PqrsStatus;
  createdAt: string;
  reviewedAt: string | null;
  resolvedAt: string | null;
}

// The three steps of a PQRS, top to bottom: what happened with its date and time in Bogota, which one
// is current, and what is still pending. Each step reads as text and icon, never as color alone.
export function StatusTimeline(props: StatusTimelineProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const steps = timelineSteps(props);
  return (
    <View style={styles.box}>
      <Text style={[typography.sectionTitle, { color: palette.textPrimary }]}>{t('pqrs.timeline.title')}</Text>
      {steps.map(({ step, at, done, current }, i) => {
        const name = t(`pqrs.status.${step}`);
        const when = at ? `${bogotaParts(at).date} · ${bogotaParts(at).time}` : null;
        const state = current ? t('pqrs.timeline.current') : done ? null : t('pqrs.timeline.pending');
        const label = [name, state?.toLowerCase(), when].filter(Boolean).join(', ');
        return (
          <View key={step} style={styles.row} accessible accessibilityLabel={label}>
            <View style={styles.rail}>
              <Icon name={ICONS[step]} size={24} color={done ? palette.primary : palette.disabledText} />
              {i < steps.length - 1 ? <View style={[styles.line, { backgroundColor: done && steps[i + 1].done ? palette.primary : palette.border }]} /> : null}
            </View>
            <View style={styles.text}>
              <Text style={[current ? typography.cardTitle : typography.body, { color: done ? palette.textPrimary : palette.textSecondary }]}>{name}</Text>
              {when ? <Text style={[typography.metadata, { color: palette.textSecondary }]}>{when}</Text> : null}
              {state ? <Text style={[typography.label, { color: palette.textSecondary }]}>{state}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 24 },
  line: { width: 2, flex: 1, minHeight: spacing.lg },
  text: { flex: 1, paddingBottom: spacing.md, gap: 2 },
});
