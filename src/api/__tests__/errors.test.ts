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
