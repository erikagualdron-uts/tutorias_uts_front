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

// Text always follows the system font size (spec 023): nothing switches the scaling off or caps it.
describe('font scaling', () => {
  it('is never turned off or capped', () => {
    const offenders = [...sources(path.join(root, 'app')), ...sources(path.join(root, 'src'))].flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((text, i) =>
          /allowFontScaling\s*=\s*\{\s*false\s*\}|allowFontScaling\s*:\s*false|maxFontSizeMultiplier/.test(text)
            ? [`${path.relative(root, file).split(path.sep).join('/')}:${i + 1}`]
            : [],
        ),
    );
    expect(offenders).toEqual([]);
  });
});
