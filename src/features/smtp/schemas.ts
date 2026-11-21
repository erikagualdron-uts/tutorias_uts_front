import { z } from 'zod';

// The same rules as the API (SaveSmtpDto): everything is required; the password may stay empty only
// when a saved one is kept (FR-027).
export const smtpSchema = (passwordRequired: boolean) =>
  z.object({
    host: z.string().trim().min(1, 'validation.required').max(255),
    port: z
      .string()
      .trim()
      .min(1, 'validation.required')
      .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 65535, 'validation.smtpPort'),
    user: z.string().trim().min(1, 'validation.required').max(255),
    password: passwordRequired ? z.string().min(1, 'validation.required').max(255) : z.string().max(255),
    from: z.string().trim().min(1, 'validation.required').max(255).email('validation.email'),
  });

export type SmtpForm = z.infer<ReturnType<typeof smtpSchema>>;
