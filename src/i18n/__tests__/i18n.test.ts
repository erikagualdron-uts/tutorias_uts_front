import { resolveLocale } from '..';

describe('resolveLocale', () => {
  it.each([
    ['es', 'es'],
    ['en', 'en'],
    ['fr', 'es'],
    ['pt', 'es'],
    [null, 'es'],
    [undefined, 'es'],
  ])('maps device language %s to %s', (device, expected) => {
    expect(resolveLocale(device)).toBe(expected);
  });
});
