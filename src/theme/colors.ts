// Source: docs/Design.md. Only the palette of that document; derived shades are marked.
export interface Palette {
  background: string;
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
  success: string;
  warning: string;
  disabledText: string;
  scrim: string;
}

export const lightPalette: Palette = {
  background: '#FFFFFF',
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
  success: '#2BA640',
  warning: '#FB8C00',
  disabledText: '#878787',
  scrim: 'rgba(0,0,0,0.4)', // derived: dialog backdrop
};

export const darkPalette: Palette = {
  background: '#0B1710', // derived
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
  success: '#2BA640',
  warning: '#FB8C00',
  disabledText: '#878787',
  scrim: 'rgba(0,0,0,0.4)', // derived: dialog backdrop
};
