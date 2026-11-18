import {
  addDays,
  compareDays,
  dayToDate,
  formatDay,
  isValidDay,
  parseDay,
  todayInBogota,
  toDay,
} from '../day';

describe('isValidDay', () => {
  it.each(['2028-02-29', '2027-02-28', '2026-12-31', '2030-01-01'])(
    'accepts %s',
    (value) => expect(isValidDay(value)).toBe(true),
  );

  it.each([
    '2027-02-29',
    '2027-13-01',
    '2027-00-10',
    '2027-04-31',
    '2027-1-1',
    '27-01-01',
    '2027/01/01',
    '',
    'basura',
  ])('rejects %p', (value) => expect(isValidDay(value)).toBe(false));
});

describe('parseDay', () => {
  it('splits a valid day', () => {
    expect(parseDay('2027-02-05')).toEqual({ year: 2027, month: 2, day: 5 });
  });

  it('returns null when the day is not valid', () => {
    expect(parseDay('2027-02-30')).toBeNull();
    expect(parseDay('')).toBeNull();
  });
});

describe('formatDay', () => {
  it('shows dd/mm/YYYY with two digits for day and month', () => {
    expect(formatDay('2027-02-05')).toBe('05/02/2027');
    expect(formatDay('2026-12-31')).toBe('31/12/2026');
  });

  it('is empty for an empty or invalid value, never "Invalid date"', () => {
    expect(formatDay('')).toBe('');
    expect(formatDay('basura')).toBe('');
    expect(formatDay('2027-02-29')).toBe('');
  });
});

describe('toDay', () => {
  it('uses the local year, month and day, whatever the hour', () => {
    expect(toDay(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    expect(toDay(new Date(2027, 0, 1, 0, 1))).toBe('2027-01-01');
  });
});

describe('dayToDate', () => {
  it('builds noon local time so a time zone shift cannot move the day', () => {
    const date = dayToDate('2027-02-05');
    expect(date?.getFullYear()).toBe(2027);
    expect(date?.getMonth()).toBe(1);
    expect(date?.getDate()).toBe(5);
    expect(date?.getHours()).toBe(12);
  });

  it('round trips through toDay', () => {
    expect(toDay(dayToDate('2026-12-31') as Date)).toBe('2026-12-31');
  });

  it('is undefined for an invalid day', () => {
    expect(dayToDate('')).toBeUndefined();
    expect(dayToDate('2027-02-29')).toBeUndefined();
  });
});

describe('addDays', () => {
  it('crosses month ends', () => {
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('goes backwards', () => {
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });
});

describe('compareDays', () => {
  it('orders days', () => {
    expect(compareDays('2027-02-05', '2027-02-06')).toBe(-1);
    expect(compareDays('2027-02-06', '2027-02-05')).toBe(1);
    expect(compareDays('2027-02-05', '2027-02-05')).toBe(0);
  });
});

describe('todayInBogota', () => {
  afterEach(() => jest.useRealTimers());

  it('returns a valid day', () => {
    expect(isValidDay(todayInBogota())).toBe(true);
  });

  it('uses the Bogota calendar day, not the UTC one', () => {
    // 02:30 UTC on Jan 2 is 21:30 on Jan 1 in Bogota (UTC-5).
    jest.useFakeTimers().setSystemTime(new Date('2027-01-02T02:30:00Z'));
    expect(todayInBogota()).toBe('2027-01-01');
  });
});
