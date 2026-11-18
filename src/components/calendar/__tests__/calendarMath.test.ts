import {
  blockPosition,
  canMoveWeek,
  clampWeek,
  daysWithSessions,
  initialWeek,
  itemSpan,
  itemsOfDay,
  layoutOverlaps,
  nowOffset,
  placeInBogota,
  selectDayForWeek,
  sessionCounts,
  visibleRange,
  weekDaysOf,
  weekStartOf,
} from '../calendarMath';
import type { CalendarItem } from '../types';

const item = (id: string, startsAt: string, endsAt: string): CalendarItem => ({
  id,
  title: id,
  room: 'A-101',
  detail: '',
  startsAt,
  endsAt,
  status: 'SCHEDULED',
  badge: 'Programada',
  strike: false,
});

// 2030-01-08 is a Tuesday: 14:00 in Bogota is 19:00Z.
const TUE_14_16 = item('a', '2030-01-08T19:00:00.000Z', '2030-01-08T21:00:00.000Z');
const PERIOD = { startsOn: '2030-01-07', endsOn: '2030-03-03' };

describe('weeks', () => {
  it('starts on Monday, also from a Sunday and from a Monday', () => {
    expect(weekStartOf('2030-01-08')).toBe('2030-01-07');
    expect(weekStartOf('2030-01-07')).toBe('2030-01-07');
    expect(weekStartOf('2030-01-13')).toBe('2030-01-07');
    expect(weekStartOf('2030-01-14')).toBe('2030-01-14');
  });

  it('lists the seven days of a week', () => {
    const days = weekDaysOf('2030-01-07');
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2030-01-07');
    expect(days[6]).toBe('2030-01-13');
  });

  it('keeps the week inside the period', () => {
    expect(clampWeek('2029-12-31', PERIOD)).toBe('2030-01-07');
    expect(clampWeek('2030-01-21', PERIOD)).toBe('2030-01-21');
    expect(clampWeek('2030-06-03', PERIOD)).toBe('2030-02-25');
    expect(clampWeek('2030-06-03', null)).toBe('2030-06-03');
  });

  it('allows the arrows only inside the period and none without one', () => {
    expect(canMoveWeek('2030-01-07', -1, PERIOD)).toBe(false);
    expect(canMoveWeek('2030-01-07', 1, PERIOD)).toBe(true);
    expect(canMoveWeek('2030-02-25', 1, PERIOD)).toBe(false);
    expect(canMoveWeek('2030-02-25', -1, PERIOD)).toBe(true);
    expect(canMoveWeek('2030-01-07', 1, null)).toBe(false);
  });

  it('opens on the week of today or the closest one of the period', () => {
    expect(initialWeek('2030-01-09', PERIOD)).toBe('2030-01-07');
    expect(initialWeek('2029-06-01', PERIOD)).toBe('2030-01-07');
    expect(initialWeek('2031-06-01', PERIOD)).toBe('2030-02-25');
  });

  it('selects today when the new week has it, otherwise the same weekday', () => {
    expect(selectDayForWeek('2030-01-07', '2030-01-09', '2030-01-16')).toBe('2030-01-09');
    expect(selectDayForWeek('2030-01-21', '2030-01-09', '2030-01-16')).toBe('2030-01-23');
    expect(selectDayForWeek('2030-01-21', '2030-01-09', '2030-01-13')).toBe('2030-01-27');
  });
});

describe('Bogota placement', () => {
  it('places a session by its Bogota day and hour', () => {
    expect(placeInBogota('2030-01-08T19:00:00.000Z')).toEqual({ day: '2030-01-08', minute: 840 });
  });

  it('keeps a late evening session on its Bogota day although in UTC it is the next day', () => {
    // 22:30 Tuesday in Bogota is 03:30 Wednesday in UTC
    expect(placeInBogota('2030-01-09T03:30:00.000Z')).toEqual({ day: '2030-01-08', minute: 1350 });
  });

  it('gives the same answer whatever the time zone of the device', () => {
    const original = process.env.TZ;
    try {
      for (const zone of ['UTC', 'America/Bogota', 'Asia/Tokyo']) {
        process.env.TZ = zone;
        expect(placeInBogota('2030-01-09T03:30:00.000Z')).toEqual({ day: '2030-01-08', minute: 1350 });
        expect(weekStartOf('2030-01-08')).toBe('2030-01-07');
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });

  it('cuts a session that runs past midnight at the end of its day', () => {
    const span = itemSpan(item('n', '2030-01-09T03:30:00.000Z', '2030-01-09T06:00:00.000Z'));
    expect(span).toEqual({ day: '2030-01-08', start: 1350, end: 1440 });
  });
});

describe('visible hours', () => {
  const hours = { earliest: '06:00', latest: '18:00' };

  it('uses the allowed hours in whole hours', () => {
    expect(visibleRange(hours, [TUE_14_16])).toEqual({ start: 360, end: 1080 });
    expect(visibleRange({ earliest: '06:30', latest: '17:15' }, [])).toEqual({ start: 360, end: 1080 });
  });

  it('widens to show a session outside them completely', () => {
    const early = item('e', '2030-01-08T10:30:00.000Z', '2030-01-08T12:00:00.000Z'); // 05:30 to 07:00
    const late = item('l', '2030-01-09T00:00:00.000Z', '2030-01-09T02:30:00.000Z'); // 19:00 to 21:30
    expect(visibleRange(hours, [early, late])).toEqual({ start: 300, end: 1320 });
  });

  it('positions a block by its minutes and never makes it shorter than 44', () => {
    const range = { start: 360, end: 1080 };
    expect(blockPosition(itemSpan(TUE_14_16), range)).toEqual({ top: 512, height: 128 });
    const short = item('s', '2030-01-08T19:00:00.000Z', '2030-01-08T19:20:00.000Z');
    expect(blockPosition(itemSpan(short), range).height).toBe(44);
  });
});

describe('overlaps and day lists', () => {
  it('gives each session its own column when two overlap and keeps others at full width', () => {
    const a = item('a', '2030-01-08T19:00:00.000Z', '2030-01-08T21:00:00.000Z');
    const b = item('b', '2030-01-08T20:00:00.000Z', '2030-01-08T22:00:00.000Z');
    const c = item('c', '2030-01-08T22:00:00.000Z', '2030-01-08T23:00:00.000Z');
    const layout = layoutOverlaps([c, b, a]);
    expect(layout.get('a')).toEqual({ column: 0, columns: 2 });
    expect(layout.get('b')).toEqual({ column: 1, columns: 2 });
    expect(layout.get('c')).toEqual({ column: 0, columns: 1 });
  });

  it('does not count a session that starts when another ends as an overlap', () => {
    const a = item('a', '2030-01-08T19:00:00.000Z', '2030-01-08T21:00:00.000Z');
    const b = item('b', '2030-01-08T21:00:00.000Z', '2030-01-08T22:00:00.000Z');
    expect(layoutOverlaps([a, b]).get('b')).toEqual({ column: 0, columns: 1 });
  });

  it('marks the days with sessions and lists those of a day by hour', () => {
    const thu = item('t', '2030-01-10T15:00:00.000Z', '2030-01-10T17:00:00.000Z');
    const second = item('b', '2030-01-08T15:00:00.000Z', '2030-01-08T16:00:00.000Z');
    expect([...daysWithSessions([TUE_14_16, thu])].sort()).toEqual(['2030-01-08', '2030-01-10']);
    expect([...sessionCounts([TUE_14_16, thu, second])]).toEqual([['2030-01-08', 2], ['2030-01-10', 1]]);
    expect(itemsOfDay([TUE_14_16, thu, second], '2030-01-08').map((i) => i.id)).toEqual(['b', 'a']);
  });
});

describe('current hour line', () => {
  const range = { start: 360, end: 1080 };

  it('is placed by the Bogota hour', () => {
    expect(nowOffset(new Date('2030-01-08T19:00:00.000Z'), range)).toBe(512); // 14:00
  });

  it('is hidden outside the visible hours', () => {
    expect(nowOffset(new Date('2030-01-08T09:00:00.000Z'), range)).toBeNull(); // 04:00
    expect(nowOffset(new Date('2030-01-09T03:00:00.000Z'), range)).toBeNull(); // 22:00
  });
});
