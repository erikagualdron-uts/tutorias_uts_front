import type { TFunction } from 'i18next';

// Codes defined in the auth, CAE configuration and modules contracts (specs/001, 006, 010, 011); the API `message` is never shown.
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
  'MODULE_SCHEDULE_INVALID',
  'MODULE_SCHEDULE_OUT_OF_HOURS',
  'MODULE_SCHEDULE_SELF_OVERLAP',
  'MODULE_TEACHER_CONFLICT',
  'MODULE_ROOM_CONFLICT',
  'MODULE_TEACHER_UNAVAILABLE',
  'MODULE_ROOM_UNAVAILABLE',
  'MODULE_ROOM_CAPACITY_BELOW_ENROLLED',
  'MODULE_HAS_ENROLLMENTS',
  'ENROLLMENT_MODULE_FULL',
  'ENROLLMENT_SCHEDULE_CONFLICT',
  'ENROLLMENT_ALREADY_ACTIVE',
  'ENROLLMENT_MODULE_UNAVAILABLE',
  'ENROLLMENT_PERIOD_NOT_OPEN',
  'ENROLLMENT_NOT_ACTIVE',
  'ENROLLMENT_CANCEL_WINDOW_PASSED',
  'ENROLLMENT_SESSION_NOT_CANCELLABLE',
  'HOLIDAY_DATE_TAKEN',
  'HOLIDAY_IN_PAST',
  'HOLIDAYS_IMPORT_UNAVAILABLE',
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
  // Rules that point at another module (teacher or room conflict) and at the enrolled students.
  const conflict = error.details?.conflict as
    | {
        moduleName?: string;
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
      }
    | undefined;
  const enrolled = Number(error.details?.enrolled);
  const capacity = Number(error.details?.capacity);
  const minutes = Number(error.details?.minutes);
  return t(`errors.${code}`, {
    seconds,
    name: other?.name ?? '',
    module: conflict?.moduleName ?? '',
    day: conflict?.dayOfWeek ? t(`modules.days.${conflict.dayOfWeek}`) : '',
    start: conflict?.startTime ?? (error.details?.earliest as string | undefined) ?? '',
    end: conflict?.endTime ?? (error.details?.latest as string | undefined) ?? '',
    enrolled: Number.isFinite(enrolled) ? enrolled : 0,
    capacity: Number.isFinite(capacity) ? capacity : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  });
}
