import { pqrsCode } from '../code';

describe('pqrsCode', () => {
  it('is the first 8 characters of the id, without dashes, in capitals', () => {
    expect(pqrsCode('a1b2c3d4-0000-4000-8000-000000000001')).toBe('A1B2C3D4');
  });

  it('always has 8 characters of 0-9 and A-F', () => {
    for (let i = 0; i < 20; i++) expect(pqrsCode(crypto.randomUUID())).toMatch(/^[0-9A-F]{8}$/);
  });

  it('does not depend on case and is the same for the same PQRS', () => {
    const id = '0f3a9c21-7d5e-4b6a-9c11-aabbccddeeff';
    expect(pqrsCode(id.toUpperCase())).toBe(pqrsCode(id));
    expect(pqrsCode(id)).toBe('0F3A9C21');
  });

  it('differs when the first 8 characters differ', () => {
    expect(pqrsCode('11111111-0000-4000-8000-000000000001')).not.toBe(pqrsCode('11111112-0000-4000-8000-000000000001'));
  });
});
