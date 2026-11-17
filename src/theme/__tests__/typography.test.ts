import { fontAssets, fontFiles, fonts } from '../fonts';
import { typography } from '../tokens';

describe('typography (docs/Design.md)', () => {
  it.each([
    ['screenTitle', 26, 32, 'bold'],
    ['sectionTitle', 19, 26, 'semibold'],
    ['cardTitle', 17, 22, 'semibold'],
    ['metricNumber', 30, 36, 'bold'],
    ['body', 15, 22, 'regular'],
    ['bodySmall', 13, 18, 'regular'],
    ['metadata', 13, 18, 'regular'],
    ['label', 12, 16, 'semibold'],
    ['button', 15, 20, 'semibold'],
    ['code', 14, 20, 'mono'],
  ] as const)('%s is %ipx/%ipx in %s', (style, size, line, font) => {
    expect(typography[style]).toMatchObject({
      fontSize: size,
      lineHeight: line,
      fontFamily: fonts[font],
    });
  });

  it('gives labels 0.02em tracking', () => {
    expect(typography.label.letterSpacing).toBeCloseTo(0.24);
  });
});

describe('font tokens', () => {
  it('has semibold and no medium weight', () => {
    expect(fonts).toHaveProperty('semibold');
    expect(fonts).not.toHaveProperty('medium');
  });

  it('only names fonts that useAppFonts loads', () => {
    for (const name of Object.values(fonts)) {
      expect(Object.keys(fontFiles)).toContain(name);
    }
    expect(Object.keys(fontFiles)).toHaveLength(Object.keys(fontAssets).length);
  });
});
