import { contrast } from '@/testing/contrast';
import { darkPalette, lightPalette, type Palette } from '../colors';

const TEXT = 4.5; // AA, normal text
const ICON = 3; // AA, large text and icons

// Text and icon pairs of docs/Design.md, per palette. Disabled text is exempt (WCAG). The severity
// button pairs live in severity.test.ts. Warning orange is a fill (or an icon beside its own text),
// never the only carrier on a light surface: it is 2.4:1 on white (docs/Design.md).
const pairs = (p: Palette): [string, string, string, number][] => [
  ...(['background', 'card', 'screen', 'surface'] as const).flatMap((bg): [string, string, string, number][] => [
    [`textPrimary on ${bg}`, p.textPrimary, p[bg], TEXT],
    [`textSecondary on ${bg}`, p.textSecondary, p[bg], TEXT],
  ]),
  ['onPrimary on primary', p.onPrimary, p.primary, TEXT],
  ['onPrimary on primaryPressed', p.onPrimary, p.primaryPressed, TEXT],
  ['onAccent on accent', p.onAccent, p.accent, TEXT],
  ['link on card', p.link, p.card, TEXT],
  ['link on screen', p.link, p.screen, TEXT],
  ['errorText on card', p.errorText, p.card, TEXT],
  ['errorText on screen', p.errorText, p.screen, TEXT],
  ['textPrimary on inputFill', p.textPrimary, p.inputFill, TEXT],
  ['textPrimary on inputFillOnScreen', p.textPrimary, p.inputFillOnScreen, TEXT],
  ['inputPlaceholder on inputFill', p.inputPlaceholder, p.inputFill, TEXT],
  ['inputPlaceholder on inputFillOnScreen', p.inputPlaceholder, p.inputFillOnScreen, TEXT],
  ['inputLabelFocus on card', p.inputLabelFocus, p.card, TEXT],
  ['primary icon on card', p.primary, p.card, ICON],
  ['errorText icon on card', p.errorText, p.card, ICON],
  ['success icon on card', p.success, p.card, ICON],
  ['textSecondary icon on inputFill', p.textSecondary, p.inputFill, ICON],
];

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
])('contrast AA (%s)', (_, palette) => {
  it.each(pairs(palette))('%s', (_name, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
