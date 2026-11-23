import { contrast } from '@/testing/contrast';
import { darkPalette, lightPalette } from '../colors';

// docs/Design.md: severity buttons and banners keep at least 4.5:1 between text and fill, pressed included.
describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
])('severity colors (%s)', (_, p) => {
  it.each([
    ['success', p.onAccent, p.success],
    ['success pressed', p.onAccent, p.successPressed],
    ['warning', p.onAccent, p.warning],
    ['warning pressed', p.onAccent, p.warningPressed],
    ['destructive', p.onError, p.error],
    ['destructive pressed', p.onError, p.errorPressed],
  ])('%s has readable text', (_name, text, fill) => {
    expect(contrast(text, fill)).toBeGreaterThanOrEqual(4.5);
  });
});
