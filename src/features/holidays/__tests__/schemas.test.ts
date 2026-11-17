import { holidaySchema } from '../schemas';

const messages = (input: unknown) => {
  const result = holidaySchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('holidaySchema', () => {
  it('accepts a name and a real day', () => {
    expect(holidaySchema.safeParse({ name: 'Festivo', date: '2030-01-22' }).success).toBe(true);
  });

  it('trims the name and requires it, up to 120 characters', () => {
    expect(holidaySchema.parse({ name: '  Festivo ', date: '2030-01-22' }).name).toBe('Festivo');
    expect(messages({ name: '   ', date: '2030-01-22' })).toEqual(['name: validation.required']);
    expect(holidaySchema.safeParse({ name: 'a'.repeat(121), date: '2030-01-22' }).success).toBe(false);
  });

  it('asks for the date once, and rejects a day that does not exist', () => {
    expect(messages({ name: 'X', date: '' })).toEqual(['date: validation.required']);
    expect(messages({ name: 'X', date: '2030-02-30' })).toEqual(['date: validation.invalidDate']);
  });
});
