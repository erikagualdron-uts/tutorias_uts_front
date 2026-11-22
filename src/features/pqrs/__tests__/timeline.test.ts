import { timelineSteps } from '../timeline';

const CREATED = '2030-01-08T19:00:00.000Z';
const REVIEWED = '2030-01-09T15:00:00.000Z';
const RESOLVED = '2030-01-10T15:00:00.000Z';
const base = { createdAt: CREATED, reviewedAt: null, resolvedAt: null };

describe('timelineSteps', () => {
  it('FILED: only the first step is done and current, with the filing date', () => {
    expect(timelineSteps({ ...base, status: 'FILED' })).toEqual([
      { step: 'FILED', at: CREATED, done: true, current: true },
      { step: 'IN_REVIEW', at: null, done: false, current: false },
      { step: 'RESOLVED', at: null, done: false, current: false },
    ]);
  });

  it('IN_REVIEW: two steps done with their dates and the second one current', () => {
    expect(timelineSteps({ ...base, status: 'IN_REVIEW', reviewedAt: REVIEWED })).toEqual([
      { step: 'FILED', at: CREATED, done: true, current: false },
      { step: 'IN_REVIEW', at: REVIEWED, done: true, current: true },
      { step: 'RESOLVED', at: null, done: false, current: false },
    ]);
  });

  it('RESOLVED: the three steps are done and the last one is current', () => {
    const steps = timelineSteps({ ...base, status: 'RESOLVED', reviewedAt: REVIEWED, resolvedAt: RESOLVED });
    expect(steps.map((s) => [s.done, s.current, s.at])).toEqual([
      [true, false, CREATED],
      [true, false, REVIEWED],
      [true, true, RESOLVED],
    ]);
  });

  it('a done step without a date stays done with no date, never an invented one', () => {
    const steps = timelineSteps({ ...base, status: 'RESOLVED', reviewedAt: null, resolvedAt: RESOLVED });
    expect(steps[1]).toEqual({ step: 'IN_REVIEW', at: null, done: true, current: false });
  });

  it('treats missing dates (an older response) as null', () => {
    const steps = timelineSteps({ status: 'IN_REVIEW', createdAt: CREATED } as never);
    expect(steps[1]).toMatchObject({ done: true, at: null });
  });
});
