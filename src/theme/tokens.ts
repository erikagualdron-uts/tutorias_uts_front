import { fonts } from './fonts';

export { fonts };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radius = {
  tooltip: 4,
  badge: 8,
  input: 12,
  banner: 12,
  card: 16,
  hero: 20,
  sheet: 24,
  header: 32,
  pill: 9999,
} as const;

export const MIN_TOUCH_TARGET = 48;
export const buttonHeight = { default: 52, compact: 44 } as const;
export const iconSize = { inline: 16, button: 20, nav: 24, empty: 40 } as const;

// Tinted deep-green shadows (docs/Design.md); `elevation` covers Android.
export const shadows = {
  level1: {
    shadowColor: '#132F20',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  level2: {
    shadowColor: '#132F20',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  level3: {
    shadowColor: '#132F20',
    shadowOpacity: 0.18,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
} as const;

// Text over the brand gradient (always white, docs/Design.md).
export const onGradient = {
  text: '#FFFFFF',
} as const;

export const gradients = {
  brand: {
    colors: ['#34531F', '#132F20'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export const motion = {
  duration: { press: 150, standard: 250, sheet: 350 },
  spring: { damping: 20, stiffness: 200 },
  pressScale: { button: 0.97, card: 0.98 },
  riseOffset: 8,
  // Brand loader (docs/Design.md, Loader): one icon per 900ms iteration; times in ms.
  loader: {
    iteration: 900,
    fadeIn: 250,
    hold: 400,
    fadeOut: 250,
    showAfter: 300,
    slowAfter: 1000,
  },
} as const;

// Sizes and weights from docs/Design.md (Typography). Components use these styles only.
export const typography = {
  screenTitle: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 26 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  metricNumber: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  metadata: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
  },
  button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  code: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 20 },
} as const;
