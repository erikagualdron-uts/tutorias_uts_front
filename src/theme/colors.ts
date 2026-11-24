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
  errorText: string;
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
  onSurfaceWarm: string;
  shadow: string;
  successText: string;
  warningText: string;
  selected: string;
  tabActive: string;
  tabInactive: string;
  controlBorder: string;
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
  errorText: '#B3261E', // error as text or icon on a card or screen
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
  inputPlaceholder: '#6E6E6E', // derived: 4.6:1 on the field fill (#767676 was 4.1:1)
  focusGlow: 'rgba(78,122,47,0.15)',
  errorGlow: 'rgba(179,38,30,0.12)',
  onSurfaceWarm: '#132F20', // text on the cream notice (11.8:1)
  shadow: '#132F20',
  successText: '#1B7A2E', // derived: success as text, 4.9:1 on the screen
  warningText: '#8A4B00', // derived: warning as text, 6.1:1 on the screen
  selected: '#E4EBDD', // derived: selected row, chip or card
  tabActive: '#34531F',
  tabInactive: '#575756',
  controlBorder: '#76827A', // derived: 3:1 border of outlined and tonal buttons and unselected chips (4.0 on white, 3.3 on selected)
};

export const darkPalette: Palette = {
  background: '#0B1710', // derived
  screen: '#0B1710', // derived
  card: '#132F20',
  surface: '#1B3D2A', // derived: lighter than the card, 5.7:1 with textSecondary
  surfaceWarm: '#2E2718', // derived: dark cream for notices (the light cream is a light surface)
  primary: '#C3D730',
  primaryPressed: '#9FB01F', // derived: darker lime so the press shows (onPrimary 6.0:1)
  onPrimary: '#132F20',
  accent: '#C3D730',
  onAccent: '#132F20',
  link: '#C3D730',
  textPrimary: '#F2F4EF',
  textSecondary: '#B3B3B3',
  border: 'rgba(255,255,255,0.08)',
  error: '#B3261E',
  errorText: '#FF8A80', // derived: 6.3:1 on the card; #B3261E is 2.2:1 on dark
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
  onSurfaceWarm: '#F8E9D4', // text on the dark cream notice (12.4:1)
  shadow: '#000000', // derived: a deep green shadow is invisible on dark
  successText: '#5BD16E', // derived: 7.4:1 on the card
  warningText: '#FFB74D', // derived: 8.3:1 on the card
  selected: '#224A33', // derived: selected row, chip or card (4.8:1 with textSecondary)
  tabActive: '#C3D730',
  tabInactive: '#B3B3B3',
  controlBorder: '#7A9A85', // derived: 3:1 control border (4.7 on card, 5.9 on screen, 3.2 on selected)
};
