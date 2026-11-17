import { configure, render, screen } from '@testing-library/react-native';
import { withRepeat, withTiming } from 'react-native-reanimated';
import { LoaderRing } from '../LoaderRing';

// This file records the animation calls so the turn and the pulse can be checked.
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: (style: () => object) => style(),
    withTiming: jest.fn((value: number) => value),
    withRepeat: jest.fn((value: number) => value),
    withSequence: (...values: number[]) => values[values.length - 1],
    cancelAnimation: jest.fn(),
    Easing: { linear: 'linear' },
  };
});

// The ring is hidden from screen readers on purpose, so queries must include it.
beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
beforeEach(() => jest.clearAllMocks());

const track = () => screen.getByTestId('loader-ring-track').props;
const arc = () => screen.getByTestId('loader-ring-arc').props;

describe('LoaderRing size and shape', () => {
  it('is 64 px across with a 3 px stroke in the regular size', async () => {
    await render(<LoaderRing size="regular" color="#111111" animated />);
    expect(track().r).toBeCloseTo(30.5); // (64 - 3) / 2
    expect(track().strokeWidth).toBe(3);
    expect(arc().strokeWidth).toBe(3);
  });

  it('is 28 px across with a 2 px stroke in the compact size', async () => {
    await render(<LoaderRing size="compact" color="#111111" animated />);
    expect(track().r).toBe(13); // (28 - 2) / 2
    expect(track().strokeWidth).toBe(2);
  });

  it('draws a faint track and a quarter-circle arc with round ends in the given color', async () => {
    await render(<LoaderRing size="regular" color="#123456" animated />);
    expect(track().stroke).toBe('#123456');
    expect(track().strokeOpacity).toBe(0.2);
    expect(arc().stroke).toBe('#123456');
    expect(arc().strokeLinecap).toBe('round');
    const [dash, gap] = String(arc().strokeDasharray).split(' ').map(Number);
    const circumference = 2 * Math.PI * 30.5;
    expect(dash).toBeCloseTo(circumference / 4); // 90 degrees
    expect(dash + gap).toBeCloseTo(circumference);
  });

  it('is hidden from screen readers', async () => {
    const { toJSON } = await render(
      <LoaderRing size="regular" color="#111111" animated />,
    );
    const root = toJSON() as { props: Record<string, unknown> };
    expect(root.props.importantForAccessibility).toBe('no-hide-descendants');
  });
});

describe('LoaderRing motion', () => {
  it('turns the arc 360 degrees per second, forever, at a constant speed', async () => {
    await render(<LoaderRing size="regular" color="#111111" animated />);
    expect(withTiming).toHaveBeenCalledWith(360, {
      duration: 1000,
      easing: 'linear',
    });
    expect(withRepeat).toHaveBeenCalledWith(360, -1, false);
  });

  it('stays still and pulses the arc between 0.4 and 1 every 1200 ms when motion is reduced', async () => {
    await render(
      <LoaderRing size="regular" color="#111111" animated={false} />,
    );
    expect(withTiming).not.toHaveBeenCalledWith(360, expect.anything());
    expect(withTiming).toHaveBeenCalledWith(1, { duration: 600 });
    expect(withTiming).toHaveBeenCalledWith(0.4, { duration: 600 });
    expect(withRepeat).toHaveBeenCalledWith(0.4, -1, false);
  });
});
