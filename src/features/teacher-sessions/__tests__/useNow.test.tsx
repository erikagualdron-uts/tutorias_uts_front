import { act, renderHook } from '@testing-library/react-native';
import { useNow } from '@/components/calendar/useNow';

describe('useNow', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2030-01-09T19:00:00.000Z') });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('gives the current instant and refreshes it every minute', async () => {
    const { result } = await renderHook(() => useNow());
    expect(result.current.toISOString()).toBe('2030-01-09T19:00:00.000Z');
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(result.current.toISOString()).toBe('2030-01-09T19:01:00.000Z');
  });

  it('stops refreshing when the screen goes away', async () => {
    const clear = jest.spyOn(globalThis, 'clearInterval');
    const { unmount } = await renderHook(() => useNow());
    await unmount();
    expect(clear).toHaveBeenCalled();
  });
});
