import { z } from 'zod';

// Mirrors the API default (auth.passwordMinLength); the API stays the source of truth.
export const PASSWORD_MIN_LENGTH = 8;

export const passwordRules = {
  length: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
  letter: (value: string) => /[A-Za-z]/.test(value),
  number: (value: string) => /\d/.test(value),
};

const email = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .email('validation.email');
const password = z
  .string()
  .refine(
    (value) => Object.values(passwordRules).every((rule) => rule(value)),
    'validation.password',
  );

// Messages are translation keys, resolved with t() where the error is shown.
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'validation.required'),
  lastName: z.string().trim().min(1, 'validation.required'),
  email,
  password,
});

export const verifyEmailSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, 'validation.code'),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'validation.required'),
  newPassword: password,
});

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, 'validation.code'),
  newPassword: password,
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
