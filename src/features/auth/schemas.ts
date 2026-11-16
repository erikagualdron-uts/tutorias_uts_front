import { z } from 'zod';

// Messages are translation keys, resolved with t() where the error is shown.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

export type LoginForm = z.infer<typeof loginSchema>;
