import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BrandLogo } from './BrandLogo';
import { FadeInView } from './FadeInView';
import {
  gradients,
  onGradient,
  radius,
  shadows,
  spacing,
  typography,
  usePalette,
} from '@/theme';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

// Shared header, form card and footer of the access screens (docs/Design.md, "Login").
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { height } = useWindowDimensions();
  const keyboard = useKeyboardVisible();
  const headerHeight = Math.round(height * (keyboard ? 0.22 : 0.35));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: palette.screen }]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <LinearGradient
          {...gradients.brand}
          colors={[...gradients.brand.colors]}
          style={[styles.header, { height: headerHeight }]}
        >
          <View style={[styles.circle, styles.circleTop]} />
          <View style={[styles.circle, styles.circleBottom]} />
          <BrandLogo variant="white" width={keyboard ? 96 : 160} />
          <Text style={[typography.screenTitle, styles.brandName]}>
            {t('brand.name')}
          </Text>
          <View style={[styles.line, { backgroundColor: palette.accent }]} />
        </LinearGradient>

        <FadeInView
          style={[
            styles.card,
            { backgroundColor: palette.card },
            shadows.level3,
          ]}
        >
          <Text
            style={[typography.screenTitle, { color: palette.textPrimary }]}
          >
            {title}
          </Text>
          {description ? (
            <Text style={[typography.body, { color: palette.textSecondary }]}>
              {description}
            </Text>
          ) : null}
          <View style={styles.content}>{children}</View>
        </FadeInView>

        <Text
          style={[
            typography.metadata,
            styles.footer,
            { color: palette.textSecondary },
          ]}
        >
          {t('brand.institution')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.header,
    borderBottomRightRadius: radius.header,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: radius.pill,
    backgroundColor: onGradient.circle,
  },
  circleTop: { width: 180, height: 180, top: -60, right: -50 },
  circleBottom: { width: 120, height: 120, bottom: -30, left: -30 },
  brandName: { color: onGradient.text },
  line: { width: 48, height: 4, borderRadius: radius.pill },
  card: {
    marginTop: -spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    borderRadius: radius.sheet,
  },
  content: { gap: spacing.lg, marginTop: spacing.lg },
  footer: { textAlign: 'center', padding: spacing.xl },
});
