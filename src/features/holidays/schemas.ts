import { z } from 'zod';
import { isValidDay } from '@/date/day';

export const holidaySchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(120),
  // Picked in the date field: YYYY-MM-DD and a real day. Empty only reports "required".
  date: z
    .string()
    .refine((value) => value.length > 0, { message: 'validation.required', abort: true })
    .refine(isValidDay, 'validation.invalidDate'),
});

export type HolidayForm = z.infer<typeof holidaySchema>;
