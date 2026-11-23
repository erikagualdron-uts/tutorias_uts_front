import { act, renderHook } from '@testing-library/react-native';
import { useCountUp } from '../hooks/useCountUp';

let mockMovement = true;
jest.mock('@/components/useMotion', () => ({ useMotion: () => ({ movement: mockMovement }) }));

const step = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

beforeEach(() => {
  mockMovement = true;
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe('useCountUp', () => {
  it('starts at 0, only goes up and ends exactly on the value at 600 ms', async () => {
    const { result } = await renderHook(() => useCountUp(40));
    expect(result.current).toBe(0);
    const seen: number[] = [];
    for (let i = 0; i < 40; i++) {
      await step(16);
      seen.push(result.current as number);
    }
    expect(seen.every((n, i) => i === 0 || n >= seen[i - 1])).toBe(true);
    expect(Math.max(...seen.slice(0, 10))).toBeLessThan(40);
    await step(100);
    expect(result.current).toBe(40);
  });

  it('shows a later change at once, without counting again from 0', async () => {
    const { result, rerender } = await renderHook((v: number) => useCountUp(v), { initialProps: 40 });
    await step(700);
    expect(result.current).toBe(40);
    await rerender(45);
    expect(result.current).toBe(45);
    await step(16);
    expect(result.current).toBe(45);
  });

  it('ends on the latest value when it changes while counting', async () => {
    const { result, rerender } = await renderHook((v: number) => useCountUp(v), { initialProps: 40 });
    await step(200);
    await rerender(50);
    await step(800);
    expect(result.current).toBe(50);
  });

  it('shows the final value from the first frame with reduce motion', async () => {
    mockMovement = false;
    const { result } = await renderHook(() => useCountUp(40));
    expect(result.current).toBe(40);
  });

  it('returns what is not a whole number as it is, with no counting', async () => {
    expect((await renderHook(() => useCountUp('2 h'))).result.current).toBe('2 h');
    expect((await renderHook(() => useCountUp('—'))).result.current).toBe('—');
    expect((await renderHook(() => useCountUp(56.7))).result.current).toBe(56.7);
  });

  it('counts a value of zero without moving', async () => {
    const { result } = await renderHook(() => useCountUp(0));
    await step(700);
    expect(result.current).toBe(0);
  });
});
