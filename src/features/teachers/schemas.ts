import { z } from 'zod';

export const createTeacherSchema = z.object({
  firstName: z.string().trim().min(1, 'validation.required'),
  lastName: z.string().trim().min(1, 'validation.required'),
  email: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .email('validation.email'),
});

export type CreateTeacherForm = z.infer<typeof createTeacherSchema>;
