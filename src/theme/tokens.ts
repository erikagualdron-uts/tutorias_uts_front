export const fonts = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
  mono: 'RobotoMono_400Regular',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const radius = {
  badge: 2,
  input: 8,
  banner: 8,
  card: 12,
  pill: 9999,
} as const;

export const MIN_TOUCH_TARGET = 48;

export const typography = {
  screenTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32 },
  sectionTitle: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 24 },
  cardTitle: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  metadata: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
  },
  button: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  code: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 20 },
} as const;
