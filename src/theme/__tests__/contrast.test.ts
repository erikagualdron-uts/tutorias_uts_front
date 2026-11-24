import { contrast } from '@/testing/contrast';
import { contrastPairs } from '@/testing/contrastPairs';
import { darkPalette, lightPalette } from '../colors';

// Every text, icon and indicator pair of docs/Design.md, per palette. The severity button pairs live in
// severity.test.ts. Warning orange and success green are fills (or an icon beside its own text): their
// text roles are warningText and successText.
describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
])('contrast AA (%s)', (_, palette) => {
  it.each(contrastPairs(palette))('%s', (_name, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
