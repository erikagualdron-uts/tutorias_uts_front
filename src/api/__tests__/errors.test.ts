import i18n from '@/i18n';
import { ApiError, errorMessage } from '../errors';

const spanish = i18n.getFixedT('es');
const english = i18n.getFixedT('en');

describe('errorMessage for modules and holidays', () => {
  it('names the module, day and hours of a teacher conflict', () => {
    const error = new ApiError(409, 'MODULE_TEACHER_CONFLICT', {
      conflict: { moduleName: 'Cálculo I', dayOfWeek: 2, startTime: '14:00', endTime: '16:00' },
    });
    expect(errorMessage(spanish, error)).toBe(
      'El docente ya tiene el módulo Cálculo I el martes de 14:00 a 16:00.',
    );
    expect(errorMessage(english, error)).toBe(
      'The teacher already has the module Cálculo I on Tuesday from 14:00 to 16:00.',
    );
  });

  it('shows enrolled students and capacity when a room is too small', () => {
    const error = new ApiError(409, 'MODULE_ROOM_CAPACITY_BELOW_ENROLLED', { enrolled: 32, capacity: 30 });
    expect(errorMessage(english, error)).toBe('Not enough capacity: 32 enrolled, this room holds 30.');
    expect(errorMessage(spanish, error)).toBe(
      'Capacidad insuficiente: hay 32 inscritos y este salón tiene capacidad para 30.',
    );
  });

  it('shows how many students block a schedule change', () => {
    const error = new ApiError(409, 'MODULE_HAS_ENROLLMENTS', { enrolled: 12 });
    expect(errorMessage(spanish, error)).toContain('(12)');
  });

  it('translates the holidays import failure', () => {
    const error = new ApiError(502, 'HOLIDAYS_IMPORT_UNAVAILABLE');
    expect(errorMessage(spanish, error)).toContain('regístralos a mano');
  });
});

describe('errorMessage for enrollments', () => {
  it('names the conflicting module, day and hours', () => {
    const error = new ApiError(409, 'ENROLLMENT_SCHEDULE_CONFLICT', {
      conflict: { moduleName: 'Física', dayOfWeek: 2, startTime: '14:00', endTime: '16:00' },
    });
    expect(errorMessage(spanish, error)).toBe('Se cruza con tu módulo Física el martes de 14:00 a 16:00.');
  });

  it('shows the cancellation window in minutes', () => {
    const error = new ApiError(409, 'ENROLLMENT_CANCEL_WINDOW_PASSED', { minutes: 60 });
    expect(errorMessage(spanish, error)).toContain('60 minutos');
    expect(errorMessage(english, error)).toContain('60 minutes');
  });

  it('has a text for every new code', () => {
    for (const code of ['ENROLLMENT_MODULE_FULL', 'ENROLLMENT_ALREADY_ACTIVE', 'ENROLLMENT_MODULE_UNAVAILABLE', 'ENROLLMENT_PERIOD_NOT_OPEN', 'ENROLLMENT_NOT_ACTIVE', 'ENROLLMENT_SESSION_NOT_CANCELLABLE'] as const) {
      expect(errorMessage(spanish, new ApiError(409, code))).not.toBe('errors.' + code);
    }
  });
});
