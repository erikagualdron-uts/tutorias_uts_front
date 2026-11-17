import { moduleSchema, toMinutes } from '../schemas';

const slot = { dayOfWeek: 2, startTime: '14:00', endTime: '16:00' };
const valid = {
  periodId: 'p1',
  name: 'Cálculo I',
  description: '',
  teacherId: 't1',
  roomId: 'r1',
  schedules: [slot],
};

const messages = (input: unknown) => {
  const result = moduleSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('moduleSchema', () => {
  it('accepts a complete module', () => {
    expect(moduleSchema.safeParse(valid).success).toBe(true);
  });

  it('converts HH:mm to minutes', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('14:30')).toBe(870);
  });

  it('requires the name and trims it', () => {
    expect(messages({ ...valid, name: '   ' })).toContain('name: validation.required');
    expect(moduleSchema.parse({ ...valid, name: '  Álgebra ' }).name).toBe('Álgebra');
  });

  it('limits the name to 120 and the description to 1000 characters', () => {
    expect(moduleSchema.safeParse({ ...valid, name: 'a'.repeat(120) }).success).toBe(true);
    expect(moduleSchema.safeParse({ ...valid, name: 'a'.repeat(121) }).success).toBe(false);
    expect(moduleSchema.safeParse({ ...valid, description: 'a'.repeat(1000) }).success).toBe(true);
    expect(moduleSchema.safeParse({ ...valid, description: 'a'.repeat(1001) }).success).toBe(false);
  });

  it('requires period, teacher and room', () => {
    const errors = messages({ ...valid, periodId: '', teacherId: '', roomId: '' });
    expect(errors).toEqual(
      expect.arrayContaining([
        'periodId: validation.required',
        'teacherId: validation.required',
        'roomId: validation.required',
      ]),
    );
  });

  it('requires at least one schedule', () => {
    expect(messages({ ...valid, schedules: [] })).toContain(
      'schedules: modules.form.scheduleRequired',
    );
  });

  it('asks for the hours of a slot that is still empty', () => {
    const errors = messages({ ...valid, schedules: [{ ...slot, startTime: '', endTime: '' }] });
    expect(errors).toEqual(
      expect.arrayContaining([
        'schedules.0.startTime: validation.required',
        'schedules.0.endTime: validation.required',
      ]),
    );
  });

  it('needs an end after the start', () => {
    for (const times of [
      { startTime: '16:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '14:00' },
    ]) {
      expect(messages({ ...valid, schedules: [{ ...slot, ...times }] })).toContain(
        'schedules.0.endTime: modules.form.endAfterStart',
      );
    }
  });

  it('keeps slots inside 06:00 to 18:00, both ends included', () => {
    for (const times of [
      { startTime: '05:45', endTime: '08:00' },
      { startTime: '17:00', endTime: '18:15' },
    ]) {
      expect(messages({ ...valid, schedules: [{ ...slot, ...times }] })).toContain(
        'schedules.0.endTime: modules.form.outOfHours',
      );
    }
    expect(messages({ ...valid, schedules: [{ ...slot, startTime: '06:00', endTime: '18:00' }] })).toEqual([]);
  });

  it('rejects two slots of the same day that overlap', () => {
    expect(
      messages({ ...valid, schedules: [slot, { ...slot, startTime: '15:00', endTime: '17:00' }] }),
    ).toContain('schedules: modules.form.scheduleOverlap');
  });

  it('accepts slots that touch, or that fall on different days', () => {
    expect(
      moduleSchema.safeParse({
        ...valid,
        schedules: [slot, { ...slot, startTime: '16:00', endTime: '18:00' }],
      }).success,
    ).toBe(true);
    expect(
      moduleSchema.safeParse({ ...valid, schedules: [slot, { ...slot, dayOfWeek: 4 }] }).success,
    ).toBe(true);
  });

  it('rejects a day outside 1 to 7', () => {
    expect(moduleSchema.safeParse({ ...valid, schedules: [{ ...slot, dayOfWeek: 0 }] }).success).toBe(false);
    expect(moduleSchema.safeParse({ ...valid, schedules: [{ ...slot, dayOfWeek: 8 }] }).success).toBe(false);
  });
});
