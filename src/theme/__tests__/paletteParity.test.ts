import { darkPalette, lightPalette } from '../colors';

const COLOR =
  /^(#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?|rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*(0|1|0?\.\d+)\))$/;

describe('palette parity', () => {
  it('has the same roles in light and dark', () => {
    expect(Object.keys(darkPalette).sort()).toEqual(
      Object.keys(lightPalette).sort(),
    );
  });

  it('has the 39 roles of docs/Design.md', () => {
    expect(Object.keys(lightPalette)).toHaveLength(39);
  });

  it.each([
    ['light', lightPalette],
    ['dark', darkPalette],
  ])('%s: every value is a valid color', (_mode, palette) => {
    for (const [role, value] of Object.entries(palette))
      expect({ role, ok: COLOR.test(value) }).toEqual({ role, ok: true });
  });
});
