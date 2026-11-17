import { z } from 'zod';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Hours a module may be held; the same window as MODULE_EARLIEST_TIME and MODULE_LATEST_TIME of the API.
export const EARLIEST_TIME = '06:00';
export const LATEST_TIME = '18:00';

// "HH:mm" to minutes from midnight (the same representation the API uses).
export const toMinutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const scheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z.string().regex(TIME, 'validation.required'),
    endTime: z.string().regex(TIME, 'validation.required'),
  })
  .superRefine((slot, ctx) => {
    // The server enforces it too (MODULE_SCHEDULE_INVALID); this anticipates the rule.
    if (!TIME.test(slot.startTime) || !TIME.test(slot.endTime)) return;
    if (toMinutes(slot.endTime) <= toMinutes(slot.startTime)) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'modules.form.endAfterStart' });
    } else if (
      slot.startTime < EARLIEST_TIME ||
      slot.endTime > LATEST_TIME
    ) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'modules.form.outOfHours' });
    }
  });

export const moduleSchema = z
  .object({
    periodId: z.string().min(1, 'validation.required'),
    name: z.string().trim().min(1, 'validation.required').max(120),
    description: z.string().trim().max(1000),
    teacherId: z.string().min(1, 'validation.required'),
    roomId: z.string().min(1, 'validation.required'),
    schedules: z.array(scheduleSchema).min(1, 'modules.form.scheduleRequired'),
  })
  .superRefine((form, ctx) => {
    // Two slots of the same module cannot overlap (half-open ranges: touching is fine).
    const valid = form.schedules.filter(
      (s) => TIME.test(s.startTime) && TIME.test(s.endTime),
    );
    for (let i = 0; i < valid.length; i++) {
      for (let j = i + 1; j < valid.length; j++) {
        const a = valid[i]!;
        const b = valid[j]!;
        if (
          a.dayOfWeek === b.dayOfWeek &&
          toMinutes(a.startTime) < toMinutes(b.endTime) &&
          toMinutes(b.startTime) < toMinutes(a.endTime)
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['schedules'],
            message: 'modules.form.scheduleOverlap',
          });
          return;
        }
      }
    }
  });

export type ModuleForm = z.infer<typeof moduleSchema>;
