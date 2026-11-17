import en from '../en.json';
import es from '../es.json';

const OFFICIAL = 'Institución Universitaria Tecnológica de Santander – UTS';

describe('institution name', () => {
  it.each([
    ['es', es],
    ['en', en],
  ])('uses the official name in %s', (_locale, messages) => {
    expect(messages.brand.institution).toBe(OFFICIAL);
  });

  it('never uses the former name', () => {
    expect(JSON.stringify([es, en])).not.toMatch(
      /Unidades Tecnol[oó]gicas de Santander/,
    );
  });
});
