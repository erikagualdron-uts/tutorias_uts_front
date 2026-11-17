import { act, renderHook } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import { FONT_LOAD_TIMEOUT_MS } from '../fonts';
import { useAppFonts } from '..';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
const mockUseFonts = useFonts as jest.Mock;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useAppFonts', () => {
  it('is not ready while the fonts load', async () => {
    mockUseFonts.mockReturnValue([false, null]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(false);
  });

  it('is ready when the fonts loaded', async () => {
    mockUseFonts.mockReturnValue([true, null]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(true);
  });

  it('is ready when loading failed, so the app is not blocked', async () => {
    mockUseFonts.mockReturnValue([false, new Error('boom')]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(true);
  });

  it('is ready after the timeout even if loading hangs', async () => {
    mockUseFonts.mockReturnValue([false, null]);
    const { result } = await renderHook(() => useAppFonts());
    await act(async () => {
      jest.advanceTimersByTime(FONT_LOAD_TIMEOUT_MS);
    });
    expect(result.current).toBe(true);
  });
});
