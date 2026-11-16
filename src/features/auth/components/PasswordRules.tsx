import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { typography, usePalette } from '@/theme';
import { PASSWORD_MIN_LENGTH, passwordRules } from '../schemas';

const RULES = [
  {
    key: 'ruleLength',
    test: passwordRules.length,
    options: { count: PASSWORD_MIN_LENGTH },
  },
  { key: 'ruleLetter', test: passwordRules.letter, options: {} },
  { key: 'ruleNumber', test: passwordRules.number, options: {} },
] as const;

// Each rule shows a symbol and announces its state; color is never the only signal.
export function PasswordRules({ password }: { password: string }) {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <View accessibilityRole="summary">
      <Text style={[typography.metadata, { color: palette.textSecondary }]}>
        {t('register.rulesTitle')}
      </Text>
      {RULES.map(({ key, test, options }) => {
        const met = test(password);
        const text = t(`register.${key}`, options);
        return (
          <Text
            key={key}
            accessibilityLabel={`${text}. ${t(met ? 'common.met' : 'common.unmet')}`}
            style={[
              typography.metadata,
              { color: met ? palette.textPrimary : palette.textSecondary },
            ]}
          >
            {met ? '✓ ' : '• '}
            {text}
          </Text>
        );
      })}
    </View>
  );
}
