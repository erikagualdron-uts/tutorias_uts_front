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

describe('Loading conventions', () => {
  it('never uses the system spinner: every loader is BrandLoader (D-078)', () => {
    const files = [
      ...sources(path.join(root, 'app')),
      ...sources(path.join(root, 'src')),
    ];
    const offenders = files
      .filter((file) => /ActivityIndicator/.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(root, file));
    expect(offenders).toEqual([]);
  });
});
