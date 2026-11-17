import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ||
        full.endsWith(path.join('src', 'theme'))
        ? []
        : sources(full);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

// Font names and weights live only in the theme (FR-003, FR-004).
describe('typography conventions', () => {
  it('writes no fontFamily or fontWeight outside src/theme', () => {
    const offenders = [
      ...sources(path.join(root, 'app')),
      ...sources(path.join(root, 'src')),
    ].filter((file) =>
      /\bfont(Family|Weight)\b/.test(fs.readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('no longer uses Roboto anywhere in the app', () => {
    const offenders = [
      ...sources(path.join(root, 'app')),
      ...sources(path.join(root, 'src')),
      path.join(root, 'package.json'),
    ].filter((file) => /roboto/i.test(fs.readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
