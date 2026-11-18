import { act, renderHook } from '@testing-library/react-native';
import { useLoaderPhase } from '../useLoaderPhase';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

describe('useLoaderPhase', () => {
  it('shows nothing for the first 300 ms, the loader until 1000 ms, then the delay message', async () => {
    const { result } = await renderHook(() => useLoaderPhase());
    expect(result.current).toBe('hidden');
    await advance(299);
    expect(result.current).toBe('hidden');
    await advance(1);
    expect(result.current).toBe('loader');
    await advance(699);
    expect(result.current).toBe('loader');
    await advance(1);
    expect(result.current).toBe('slow');
  });

  it('starts in the loader phase, with no timers, when it is not delayed', async () => {
    const schedule = jest.spyOn(global, 'setTimeout');
    const { result } = await renderHook(() => useLoaderPhase(false));
    expect(result.current).toBe('loader');
    const delays = schedule.mock.calls.map((call) => call[1]);
    expect(delays).not.toContain(300);
    expect(delays).not.toContain(1000);
    await advance(2000);
    expect(result.current).toBe('loader');
    schedule.mockRestore();
  });

  it('schedules the 300 and 1000 ms timers and cancels both when it unmounts', async () => {
    const schedule = jest.spyOn(global, 'setTimeout');
    const cancel = jest.spyOn(global, 'clearTimeout');
    const { unmount } = await renderHook(() => useLoaderPhase());
    const delays = schedule.mock.calls.map((call) => call[1]);
    expect(delays).toContain(300);
    expect(delays).toContain(1000);
    const ids = schedule.mock.results
      .filter((_, i) =>
        [300, 1000].includes(schedule.mock.calls[i][1] as number),
      )
      .map((r) => r.value);
    cancel.mockClear();
    await unmount();
    ids.forEach((id) => expect(cancel).toHaveBeenCalledWith(id));
    schedule.mockRestore();
    cancel.mockRestore();
  });

  it('starts counting from zero when it mounts again', async () => {
    const first = await renderHook(() => useLoaderPhase());
    await advance(1200);
    expect(first.result.current).toBe('slow');
    await first.unmount();
    const second = await renderHook(() => useLoaderPhase());
    expect(second.result.current).toBe('hidden');
    await advance(300);
    expect(second.result.current).toBe('loader');
  });
});
