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

// Geometric decoration (circles, arcs, blobs) is replaced by BrandPattern (D-049). The loading ring
// (D-080) is feedback, not decoration: it is drawn as an SVG shape in LoaderRing and adds no such key.
describe('brand decoration', () => {
  it('has no circle, arc or blob style keys or usages', () => {
    const offenders = [
      ...sources(path.join(root, 'app')),
      ...sources(path.join(root, 'src')),
    ].filter((file) =>
      /\bstyles\.(circle|arc|blob)\w*|\b(circle|arc|blob)\w*\s*:/i.test(
        fs.readFileSync(file, 'utf8'),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
