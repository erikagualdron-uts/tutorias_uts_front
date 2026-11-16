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

const files = [
  ...sources(path.join(root, 'app')),
  ...sources(path.join(root, 'src')),
];

describe('UI conventions', () => {
  it('uses no icon library other than Iconify', () => {
    const offenders = files.filter((file) =>
      /vector-icons|expo-symbols|lucide|react-native-vector-icons/.test(
        fs.readFileSync(file, 'utf8'),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it('keeps hex colors out of screens', () => {
    const screens = [
      ...sources(path.join(root, 'app')),
      ...sources(path.join(root, 'src/features')),
    ];
    const offenders = screens.filter((file) =>
      /#[0-9A-Fa-f]{6}\b/.test(fs.readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
