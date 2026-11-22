import { z } from 'zod';

export const teacherEditSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(80, 'validation.tooLong'),
  lastName: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(80, 'validation.tooLong'),
  phone: z.string().trim().max(30, 'validation.tooLong'),
});

export type TeacherEditForm = z.infer<typeof teacherEditSchema>;
