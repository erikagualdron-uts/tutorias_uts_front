import { periodSchema } from '../schemas';

const base = { name: '2030-1', startsOn: '2030-02-01', endsOn: '2030-06-15' };

const messages = (input: Record<string, string>) => {
  const result = periodSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
};

describe('periodSchema dates', () => {
  it('accepts an end after the start', () => {
    expect(periodSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an end equal to the start, on the end field', () => {
    expect(messages({ ...base, endsOn: '2030-02-01' })).toEqual({
      endsOn: 'periods.form.endAfterStart',
    });
  });

  it('rejects an end before the start, on the end field', () => {
    expect(messages({ ...base, endsOn: '2030-01-31' })).toEqual({
      endsOn: 'periods.form.endAfterStart',
    });
  });

  it('asks for an empty date', () => {
    expect(messages({ ...base, startsOn: '', endsOn: '' })).toEqual({
      startsOn: 'validation.required',
      endsOn: 'validation.required',
    });
  });

  it('rejects a day that does not exist', () => {
    expect(messages({ ...base, startsOn: '2027-02-29' })).toEqual({
      startsOn: 'validation.invalidDate',
    });
  });

  it('accepts the leap day', () => {
    expect(
      periodSchema.safeParse({
        ...base,
        startsOn: '2028-02-29',
        endsOn: '2028-03-01',
      }).success,
    ).toBe(true);
  });
});
