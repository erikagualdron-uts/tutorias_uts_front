import { z } from 'zod';

const day = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'periods.form.dateFormat');

export const periodSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(50),
  startsOn: day,
  endsOn: day,
});

export type PeriodForm = z.infer<typeof periodSchema>;
