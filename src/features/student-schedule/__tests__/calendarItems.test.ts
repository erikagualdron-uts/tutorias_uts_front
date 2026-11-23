import i18n from '@/i18n';
import { sessionStateKey, toCalendarItem } from '../calendarItems';
import { studentSessionOf } from '../test-fixtures';

const t = i18n.t.bind(i18n);

beforeEach(async () => {
  await i18n.changeLanguage('es');
});

describe('toCalendarItem', () => {
  it('shows a scheduled session with its module, room and teacher', () => {
    expect(toCalendarItem(studentSessionOf(), t)).toMatchObject({
      id: 's1',
      title: 'Cálculo I',
      room: 'A-101',
      detail: 'Ana Pérez',
      badge: 'Programada',
      status: 'SCHEDULED',
      strike: false,
      note: undefined,
    });
  });

  it('keeps the original hour of a rescheduled session in a note', () => {
    const item = toCalendarItem(
      studentSessionOf({ status: 'RESCHEDULED', startsAt: '2030-01-09T15:00:00.000Z', endsAt: '2030-01-09T17:00:00.000Z' }),
      t,
    );
    expect(item.badge).toBe('Reprogramada');
    expect(item.note).toMatch(/Antes: .* · 14:00/);
    expect(item.strike).toBe(false);
  });

  it.each([
    ['HOLIDAY', 'Cancelada por festivo'],
    ['TEACHER', 'Cancelada por el docente'],
  ] as const)('strikes a session cancelled by %s and names the reason', (reason, text) => {
    expect(toCalendarItem(studentSessionOf({ status: 'CANCELLED', cancelReason: reason }), t)).toMatchObject({
      badge: text,
      strike: true,
      status: 'CANCELLED',
    });
  });

  it('strikes the session the student skipped and says it was them', () => {
    expect(toCalendarItem(studentSessionOf({ absent: true }), t)).toMatchObject({ badge: 'Cancelada por ti', strike: true, status: 'CANCELLED' });
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    expect(toCalendarItem(studentSessionOf({ absent: true }), t).badge).toBe('Cancelled by you');
    expect(toCalendarItem(studentSessionOf({ status: 'CANCELLED', cancelReason: 'TEACHER' }), t).badge).toBe('Cancelled by the teacher');
  });
});

describe('sessionStateKey', () => {
  it('puts the cause of the institution before the choice of the student', () => {
    expect(sessionStateKey(studentSessionOf({ status: 'CANCELLED', cancelReason: 'HOLIDAY', absent: true }))).toBe('HOLIDAY');
    expect(sessionStateKey(studentSessionOf({ status: 'CANCELLED', cancelReason: 'TEACHER', absent: true }))).toBe('TEACHER');
  });

  it('is STUDENT for a skipped session that nobody cancelled, even if it was rescheduled', () => {
    expect(sessionStateKey(studentSessionOf({ absent: true }))).toBe('STUDENT');
    expect(sessionStateKey(studentSessionOf({ status: 'RESCHEDULED', absent: true }))).toBe('STUDENT');
  });

  it('follows the status of the session otherwise', () => {
    expect(sessionStateKey(studentSessionOf())).toBe('SCHEDULED');
    expect(sessionStateKey(studentSessionOf({ status: 'RESCHEDULED' }))).toBe('RESCHEDULED');
  });
});
