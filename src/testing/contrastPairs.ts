import type { Palette } from '@/theme/colors';

export const TEXT_RATIO = 4.5; // AA, normal text
export const ICON_RATIO = 3; // AA, large text, icons and state indicators

export type ContrastPair = [
  name: string,
  foreground: string,
  background: string,
  minimum: number,
];

type Opaque = keyof Palette;

// Exempt by design (docs/Design.md): disabledText (WCAG), inputBorder (soft border rule of CLAUDE.md,
// the field is told apart by fill, label and focus border), border and scrim (decorative), accent as a fill.
const text = (fg: Opaque[], bg: Opaque[]): [Opaque, Opaque][] =>
  fg.flatMap((f) => bg.map((b): [Opaque, Opaque] => [f, b]));

const TEXT_PAIRS: [Opaque, Opaque][] = [
  ...text(
    ['textPrimary', 'textSecondary'],
    ['background', 'screen', 'card', 'surface', 'selected'],
  ),
  ['onSurfaceWarm', 'surfaceWarm'],
  ['onPrimary', 'primary'],
  ['onPrimary', 'primaryPressed'],
  ['onAccent', 'accent'],
  ['onError', 'error'],
  ...text(['link'], ['card', 'screen', 'surface']),
  ...text(['errorText', 'successText', 'warningText'], ['card', 'screen']),
  ...text(
    ['textPrimary', 'inputPlaceholder'],
    ['inputFill', 'inputFillOnScreen'],
  ),
  ['inputLabelFocus', 'card'],
];

const ICON_PAIRS: [Opaque, Opaque][] = [
  ...text(
    [
      'primary',
      'success',
      'errorText',
      'tabActive',
      'tabInactive',
      'inputBorderFocus',
    ],
    ['card'],
  ),
  ['textSecondary', 'inputFill'],
];

// Every text, icon and indicator pair of the palette (docs/Design.md, role table), with its minimum.
export const contrastPairs = (p: Palette): ContrastPair[] => [
  ...TEXT_PAIRS.map(([f, b]): ContrastPair => [
    `${f} on ${b}`,
    p[f],
    p[b],
    TEXT_RATIO,
  ]),
  ...ICON_PAIRS.map(([f, b]): ContrastPair => [
    `${f} icon on ${b}`,
    p[f],
    p[b],
    ICON_RATIO,
  ]),
];
