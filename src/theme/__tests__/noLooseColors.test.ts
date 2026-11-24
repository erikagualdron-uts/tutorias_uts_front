import { readdirSync, readFileSync } from 'fs';
import { join, relative, sep } from 'path';

const ROOT = join(__dirname, '../../..');

// Brand assets that carry their own colors; each needs a reason (docs/Design.md, University brand elements).
const BRAND_EXCEPTIONS: Record<string, string> = {};

const SKIPPED_DIRS = new Set(['theme', '__tests__', 'testing', 'node_modules']);

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return SKIPPED_DIRS.has(entry.name) ? [] : sources(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

const files = [
  ...sources(join(ROOT, 'src')),
  ...sources(join(ROOT, 'app')),
].filter(
  (file) => !(relative(ROOT, file).split(sep).join('/') in BRAND_EXCEPTIONS),
);

const COLOR_LITERAL = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b|\brgba?\(|\bhsla?\(/;
const COLOR_NAME =
  /[cC]olor\s*[:=]\s*\{?\s*['"](white|black|red|blue|green|gray|grey|yellow|orange)['"]/;
// Fonts and fixed sizes come from the theme (fonts, typography, spacing, radius).
const FONT_NAME = /fontFamily\s*:\s*['"]/;
const FIXED_SIZE =
  /\b(font[sS]ize|border(?:Top|Bottom)?(?:Left|Right)?Radius)\s*:\s*[1-9]\d*\b/;

describe('no values outside the theme', () => {
  it('scans the app', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each([
    ['colors', COLOR_LITERAL],
    ['color names', COLOR_NAME],
    ['font names', FONT_NAME],
    ['fixed font sizes and radii', FIXED_SIZE],
  ])('has no %s', (_name, pattern) => {
    const offenders = files.filter((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => !line.trim().startsWith('//') && pattern.test(line)),
    );
    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });
});
