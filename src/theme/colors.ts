// Source: docs/Design.md. Only the palette of that document; derived shades are marked.
export interface Palette {
  background: string;
  screen: string;
  card: string;
  surface: string;
  surfaceWarm: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  link: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  error: string;
  errorPressed: string;
  onError: string;
  success: string;
  successPressed: string;
  warning: string;
  warningPressed: string;
  disabledText: string;
  scrim: string;
  inputFill: string;
  inputFillOnScreen: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputLabelFocus: string;
  inputPlaceholder: string;
  focusGlow: string;
  errorGlow: string;
}

export const lightPalette: Palette = {
  background: '#FFFFFF',
  screen: '#F2F4EF', // derived: list and dashboard screens
  card: '#FFFFFF',
  surface: '#F2F4EF', // derived
  surfaceWarm: '#F8E9D4',
  primary: '#34531F',
  primaryPressed: '#132F20',
  onPrimary: '#FFFFFF',
  accent: '#C3D730', // never as text or icon on white
  onAccent: '#132F20',
  link: '#4E7A2F', // derived
  textPrimary: '#132F20',
  textSecondary: '#575756',
  border: '#E5E5E5',
  error: '#B3261E', // derived
  errorPressed: '#6D100A',
  onError: '#FFFFFF',
  success: '#2BA640',
  successPressed: '#3DBB55', // derived: 5.8:1 with onAccent
  warning: '#FB8C00',
  warningPressed: '#E07B00', // derived: 4.8:1 with onAccent
  disabledText: '#878787',
  scrim: 'rgba(0,0,0,0.4)', // derived: dialog backdrop
  // derived (docs/Design.md, Inputs): fields always have a fill and a soft border
  inputFill: '#F2F4EF', // on white cards and sheets
  inputFillOnScreen: '#FFFFFF', // on the screen background
  inputBorder: '#C9D0C3',
  inputBorderFocus: '#4E7A2F',
  inputLabelFocus: '#34531F',
  inputPlaceholder: '#767676',
  focusGlow: 'rgba(78,122,47,0.15)',
  errorGlow: 'rgba(179,38,30,0.12)',
};

export const darkPalette: Palette = {
  background: '#0B1710', // derived
  screen: '#0B1710', // derived
  card: '#132F20',
  surface: '#132F20',
  surfaceWarm: '#F8E9D4',
  primary: '#C3D730',
  primaryPressed: '#C3D730',
  onPrimary: '#132F20',
  accent: '#C3D730',
  onAccent: '#132F20',
  link: '#C3D730',
  textPrimary: '#F2F4EF',
  textSecondary: '#B3B3B3',
  border: 'rgba(255,255,255,0.08)',
  error: '#B3261E',
  errorPressed: '#6D100A',
  onError: '#FFFFFF',
  success: '#2BA640',
  successPressed: '#3DBB55', // derived: 5.8:1 with onAccent
  warning: '#FB8C00',
  warningPressed: '#E07B00', // derived: 4.8:1 with onAccent
  disabledText: '#878787',
  scrim: 'rgba(0,0,0,0.4)', // derived: dialog backdrop
  // derived (docs/Design.md, Inputs, dark mode)
  inputFill: '#0B1710',
  inputFillOnScreen: '#0B1710',
  inputBorder: 'rgba(255,255,255,0.16)',
  inputBorderFocus: '#C3D730',
  inputLabelFocus: '#C3D730',
  inputPlaceholder: '#B3B3B3',
  focusGlow: 'rgba(195,215,48,0.18)',
  errorGlow: 'rgba(179,38,30,0.25)',
};
