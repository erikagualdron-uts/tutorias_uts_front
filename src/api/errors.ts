import type { TFunction } from 'i18next';

// Codes defined in specs/001-auth-roles/contracts/auth-api.yaml; the API `message` is never shown.
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'EMAIL_ALREADY_REGISTERED',
  'EMAIL_DOMAIN_NOT_ALLOWED',
  'CODE_INVALID',
  'CODE_EXPIRED',
  'CODE_ATTEMPTS_EXCEEDED',
  'INVALID_CREDENTIALS',
  'EMAIL_NOT_VERIFIED',
  'ACCOUNT_DISABLED',
  'ACCOUNT_UNAVAILABLE',
  'SESSION_EXPIRED',
  'SESSION_REVOKED',
  'TOKEN_INVALID',
  'PASSWORD_TOO_WEAK',
  'PASSWORD_SAME_AS_CURRENT',
  'PASSWORD_CHANGE_REQUIRED',
  'FORBIDDEN_ROLE',
  'RATE_LIMITED',
  'NOT_FOUND',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number] | 'NETWORK' | 'UNKNOWN';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    readonly details?: Record<string, unknown>,
  ) {
    super(code);
  }
}

const isKnown = (code: string): code is ErrorCode =>
  code === 'NETWORK' || (ERROR_CODES as readonly string[]).includes(code);

// Translated text for any error thrown by the API client.
export function errorMessage(t: TFunction, error: unknown): string {
  if (!(error instanceof ApiError)) return t('errors.UNKNOWN');
  const code = isKnown(error.code) ? error.code : 'UNKNOWN';
  const seconds = Number(error.details?.retryAfterSeconds ?? 0);
  return t(`errors.${code}`, { seconds });
}
