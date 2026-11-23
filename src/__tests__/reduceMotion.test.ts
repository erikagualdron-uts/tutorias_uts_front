import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name === '__tests__' ? [] : sources(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const ANIMATES =
  /\b(withTiming|withRepeat|withSpring|withSequence|withDelay|FadeIn\w*|FadeOut\w*|SlideIn\w*|SlideOut\w*|requestAnimationFrame)\b|\bentering=|\bexiting=|\bAnimated\.(timing|spring|loop|sequence)\b/;
// A file that animates must ask for "reduce motion" itself, go through FadeInView (which does), or
// take an `animated` prop its parent already decided.
const RESPECTS =
  /\b(useMotion|useReducedMotion|FadeInView)\b|\banimated\b\s*[,:)=}?]|\banimated\??:/;
// File (relative to the root) -> why it may animate without the check above.
const EXCEPTIONS: Record<string, string> = {};

describe('reduce motion', () => {
  it('has no animation that ignores the setting', () => {
    const offenders = [...sources(path.join(root, 'app')), ...sources(path.join(root, 'src'))]
      .filter((file) => {
        const code = fs.readFileSync(file, 'utf8');
        return ANIMATES.test(code) && !RESPECTS.test(code);
      })
      .map((file) => path.relative(root, file).split(path.sep).join('/'))
      .filter((file) => !(file in EXCEPTIONS));
    expect(offenders).toEqual([]);
  });

  it('has no exception for a file that no longer exists', () => {
    for (const file of Object.keys(EXCEPTIONS))
      expect(fs.existsSync(path.join(root, file))).toBe(true);
  });
});
