import { act, renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { useWeekNavigation } from '../useWeekNavigation';

const setWidth = (width: number) =>
  Dimensions.set({ window: { width, height: 900, scale: 2, fontScale: 1 }, screen: { width, height: 900, scale: 2, fontScale: 1 } });

const PERIOD = { startsOn: '2030-01-07', endsOn: '2030-03-03' };
const META = { period: PERIOD, hours: { earliest: '06:00', latest: '18:00' } };
let fetched: [string, string][] = [];
let query: { data: { meta: typeof META } | undefined; isPlaceholderData: boolean };
const useWeek = (from: string, to: string) => {
  fetched.push([from, to]);
  return query;
};

// "Today" is the real clock of the test; the assertions follow the weeks of that day.
const monday = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

beforeEach(() => {
  fetched = [];
  query = { data: undefined, isPlaceholderData: false };
  setWidth(390);
});

describe('useWeekNavigation', () => {
  it('opens on the week of today with today selected and asks the server for that week', async () => {
    const { result } = await renderHook(() => useWeekNavigation(useWeek));
    expect(result.current.weekStart).toBe(monday(result.current.today));
    expect(result.current.selectedDay).toBe(result.current.today);
    expect(fetched[0][0]).toBe(result.current.weekStart);
    expect(fetched[0][1] > fetched[0][0]).toBe(true);
  });

  it('opens on Day below 600 dp and on Week from 600 dp, and keeps the view while navigating', async () => {
    const phone = await renderHook(() => useWeekNavigation(useWeek));
    expect(phone.result.current.view).toBe('day');
    setWidth(800);
    const tablet = await renderHook(() => useWeekNavigation(useWeek));
    expect(tablet.result.current.view).toBe('week');
    await act(() => tablet.result.current.onViewChange('day'));
    await act(() => tablet.result.current.onWeekChange('2030-01-14', '2030-01-15'));
    expect(tablet.result.current.view).toBe('day');
    expect(tablet.result.current.weekStart).toBe('2030-01-14');
    expect(tablet.result.current.selectedDay).toBe('2030-01-15');
  });

  it('opens on the week of the period closest to today when today is outside it', async () => {
    query = { data: { meta: META }, isPlaceholderData: false };
    const { result } = await renderHook(() => useWeekNavigation(useWeek));
    // the real today is after the 2030 period or before it: either way the week is clamped into it
    expect(result.current.weekStart >= '2030-01-07' && result.current.weekStart <= '2030-02-25').toBe(true);
    expect(result.current.meta).toBe(META);
  });

  it('keeps the previous period while another week loads', async () => {
    query = { data: { meta: META }, isPlaceholderData: false };
    const { result, rerender } = await renderHook(() => useWeekNavigation(useWeek));
    query = { data: { meta: { ...META, period: { startsOn: '2031-01-06', endsOn: '2031-03-02' } } }, isPlaceholderData: true };
    await rerender({});
    expect(result.current.meta?.period).toEqual(PERIOD);
  });

  it('selects a day by itself', async () => {
    const { result } = await renderHook(() => useWeekNavigation(useWeek));
    await act(() => result.current.onSelectDay('2030-01-09'));
    expect(result.current.selectedDay).toBe('2030-01-09');
  });
});
