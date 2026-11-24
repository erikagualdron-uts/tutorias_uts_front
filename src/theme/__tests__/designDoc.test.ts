import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { darkPalette, lightPalette } from '../colors';

// docs/Design.md lives in the sibling repo `Claude`; DESIGN_MD_PATH points elsewhere when it is not there.
const DOC =
  process.env.DESIGN_MD_PATH ??
  resolve(__dirname, '../../../../Claude/docs/Design.md');

function roleTable(): Record<string, { light: string; dark: string }> {
  if (!existsSync(DOC))
    throw new Error('Design.md no encontrado: defina DESIGN_MD_PATH');
  const rows = readFileSync(DOC, 'utf8').matchAll(
    /^\| `(\w+)` \| `([^`]+)` \| `([^`]+)` \|/gm,
  );
  return Object.fromEntries(
    [...rows].map(([, role, light, dark]) => [role, { light, dark }]),
  );
}

describe('Design.md role table', () => {
  const table = roleTable();

  it('has the same roles as the theme', () => {
    expect(Object.keys(table).sort()).toEqual(Object.keys(lightPalette).sort());
  });

  it.each(Object.keys(lightPalette))(
    '%s has the value of the theme in both modes',
    (role) => {
      expect(table[role]).toEqual({
        light: lightPalette[role as keyof typeof lightPalette],
        dark: darkPalette[role as keyof typeof darkPalette],
      });
    },
  );
});
