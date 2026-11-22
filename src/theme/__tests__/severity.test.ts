import { darkPalette, lightPalette } from '../colors';

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

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
