import { z } from 'zod';
import { compareDays, isValidDay } from '@/date/day';

// A calendar day picked in the date field: YYYY-MM-DD, and a real day of the calendar.
// An empty value only reports "required", not also "invalid".
const day = z
  .string()
  .refine((value) => value.length > 0, {
    message: 'validation.required',
    abort: true,
  })
  .refine(isValidDay, 'validation.invalidDate');

export const periodSchema = z
  .object({
    name: z.string().trim().min(1, 'validation.required').max(50),
    startsOn: day,
    endsOn: day,
  })
  .superRefine((form, ctx) => {
    // The server validates it too (PERIOD_DATES_INVALID); this anticipates the rule.
    if (
      isValidDay(form.startsOn) &&
      isValidDay(form.endsOn) &&
      compareDays(form.endsOn, form.startsOn) <= 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsOn'],
        message: 'periods.form.endAfterStart',
      });
    }
  });

export type PeriodForm = z.infer<typeof periodSchema>;
