import { ERROR_CODES } from '@/api/errors';
import en from '../en.json';
import es from '../es.json';

type Tree = { [key: string]: string | Tree };

const keysOf = (tree: Tree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [`${prefix}${key}`]
      : keysOf(value, `${prefix}${key}.`),
  );

describe('translation files', () => {
  it('have exactly the same keys in Spanish and English', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(es).sort());
  });

  it('translate every API error code plus the client-side ones', () => {
    for (const code of [...ERROR_CODES, 'NETWORK', 'UNKNOWN']) {
      expect((es.errors as Record<string, string>)[code]).toBeTruthy();
      expect((en.errors as Record<string, string>)[code]).toBeTruthy();
    }
  });

  it('keep the same interpolation placeholders in both languages', () => {
    const placeholders = (text: string) =>
      (text.match(/{{\w+}}/g) ?? []).sort();
    const esFlat = Object.fromEntries(
      keysOf(es).map((key) => [
        key,
        key
          .split('.')
          .reduce<string | Tree>(
            (node, part) => (node as Tree)[part],
            es,
          ) as string,
      ]),
    );
    const enFlat = Object.fromEntries(
      keysOf(en).map((key) => [
        key,
        key
          .split('.')
          .reduce<string | Tree>(
            (node, part) => (node as Tree)[part],
            en,
          ) as string,
      ]),
    );
    for (const key of Object.keys(esFlat))
      expect(placeholders(esFlat[key])).toEqual(placeholders(enFlat[key]));
  });
});
