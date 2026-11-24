import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/icons/Icon';
import type { IconName } from '@/icons/registry';
import { radius, useShadows, spacing, typography, usePalette } from '@/theme';
import { FadeInView } from './FadeInView';

export type BannerSeverity = 'info' | 'success' | 'warning' | 'error';

interface BannerProps {
  message: string;
  severity?: BannerSeverity;
}

const ICONS: Record<BannerSeverity, IconName> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

// Notices and the rule that blocks an action (docs/Design.md, Banners). `info` is the quiet cream
// notice; the other severities are solid fills with a shadow so an alert is seen before anything else.
export function Banner({ message, severity = 'info' }: BannerProps) {
  const palette = usePalette();
  const shadows = useShadows();
  const { fill, ink } = {
    info: { fill: palette.surfaceWarm, ink: palette.onSurfaceWarm },
    success: { fill: palette.success, ink: palette.onAccent },
    warning: { fill: palette.warning, ink: palette.onAccent },
    error: { fill: palette.error, ink: palette.onError },
  }[severity];
  return (
    <FadeInView>
      <View
        accessibilityRole="alert"
        style={[
          styles.box,
          { backgroundColor: fill },
          severity !== 'info' && shadows.level1,
        ]}
      >
        <Icon name={ICONS[severity]} color={ink} />
        <Text
          style={[
            severity === 'info' ? typography.body : typography.button,
            styles.text,
            { color: ink },
          ]}
        >
          {message}
        </Text>
      </View>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.banner,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: { flex: 1 },
});
