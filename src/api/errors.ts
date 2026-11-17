import type { TFunction } from 'i18next';

// Codes defined in the auth and CAE configuration contracts (specs/001, specs/006); the API `message` is never shown.
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
  'PERIOD_NAME_TAKEN',
  'PERIOD_DATES_INVALID',
  'PERIOD_DATES_OVERLAP',
  'PERIOD_ACTIVE_EXISTS',
  'PERIOD_CLOSED_READ_ONLY',
  'PERIOD_HAS_MODULES',
  'PERIOD_NOT_UPCOMING',
  'PERIOD_ALREADY_ENDED',
  'PERIOD_NOT_ACTIVE',
  'LOCATION_NAME_TAKEN',
  'LOCATION_HAS_ACTIVE_ROOMS',
  'ROOM_NAME_TAKEN',
  'ROOM_CAPACITY_INVALID',
  'ROOM_IN_ACTIVE_PERIOD',
  'ROOM_CAPACITY_BELOW_ENROLLED',
  'ROOM_INACTIVE_OR_DELETED',
  'DROPDOWN_LABEL_REQUIRED',
  'DROPDOWN_ITEM_IN_USE',
  'DROPDOWN_ORDER_INVALID',
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
  // Rules that name the other record (overlapping or active period) get its name.
  const other = (error.details?.overlappingPeriod ??
    error.details?.activePeriod) as { name?: string } | undefined;
  return t(`errors.${code}`, { seconds, name: other?.name ?? '' });
}
