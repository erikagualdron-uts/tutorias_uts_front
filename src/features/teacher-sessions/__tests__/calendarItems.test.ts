import i18n from '@/i18n';
import { toCalendarItem } from '../calendarItems';
import { teacherSessionOf } from '../test-fixtures';

const t = i18n.t.bind(i18n);

beforeEach(async () => {
  await i18n.changeLanguage('es');
});

describe('toCalendarItem', () => {
  it('shows a scheduled session with its module, room and attendees', () => {
    expect(toCalendarItem(teacherSessionOf(), t)).toMatchObject({
      id: 's1',
      title: 'Cálculo I',
      room: 'A-101',
      detail: '12 asistentes',
      badge: 'Programada',
      strike: false,
      note: undefined,
    });
  });

  it('keeps the original hour of a rescheduled session in a note', () => {
    const item = toCalendarItem(
      teacherSessionOf({ status: 'RESCHEDULED', startsAt: '2030-01-09T15:00:00.000Z', endsAt: '2030-01-09T17:00:00.000Z' }),
      t,
    );
    expect(item.badge).toBe('Reprogramada');
    expect(item.note).toMatch(/Antes: .* · 14:00/);
    expect(item.strike).toBe(false);
  });

  it.each([
    ['HOLIDAY', 'Cancelada por festivo'],
    ['TEACHER', 'Cancelada por ti'],
  ] as const)('strikes a session cancelled by %s and names the reason', (reason, text) => {
    const item = toCalendarItem(teacherSessionOf({ status: 'CANCELLED', cancelReason: reason, attendees: 0 }), t);
    expect(item).toMatchObject({ badge: text, strike: true, status: 'CANCELLED' });
  });

  it('speaks English', async () => {
    await i18n.changeLanguage('en');
    expect(toCalendarItem(teacherSessionOf(), t)).toMatchObject({ badge: 'Scheduled', detail: '12 attending' });
  });
});
