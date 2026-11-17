import {
  act,
  configure,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import i18n from '@/i18n';
import { BrandLoader } from '../BrandLoader';

// This file runs the animated style for real (the global mock returns an empty style) and
// freezes the clock at 0.1 of the first icon, so a fade shows as a value between 0 and 1.
let mockReduced = false;
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: { View },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    Keyframe: class {
      duration() {
        return this;
      }
    },
    withSequence: (...values: number[]) => values[values.length - 1],
    useSharedValue: () => ({ value: 0.1 }),
    useAnimatedStyle: (style: () => object) => style(),
    withTiming: () => 0.1,
    withRepeat: (value: number) => value,
    cancelAnimation: jest.fn(),
    Easing: { linear: 'linear', bezier: () => 'bezier' },
    useReducedMotion: () => mockReduced,
  };
});

beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
let announce: jest.SpyInstance;
beforeEach(async () => {
  announce = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(() => undefined);
  mockReduced = false;
  await i18n.changeLanguage('es');
  jest.useFakeTimers();
});
afterEach(async () => {
  await cleanup(); // unmount before the next test changes the language
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
const opacities = () =>
  ['book-open-page-variant', 'feather', 'leaf'].map((icon) => {
    const layer = screen.getByTestId(`icon:mdi:${icon}`).parent!;
    const style = [layer.props.style].flat(2).find((s) => s && 'opacity' in s);
    return style.opacity as number;
  });

describe('BrandLoader accessibility', () => {
  it('is one progress element with the translated label and the busy state', async () => {
    await render(<BrandLoader />);
    await advance(300);
    const bar = screen.getByRole('progressbar');
    expect(bar.props.accessibilityLabel).toBe('Cargando…');
    expect(bar.props.accessibilityState).toEqual({ busy: true });
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
  });

  it('is not exposed to screen readers while nothing is painted yet', async () => {
    await render(<BrandLoader />);
    await advance(299);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('hides the icons from screen readers and keeps the label while they change', async () => {
    await render(<BrandLoader />);
    await advance(300);
    for (const icon of ['book-open-page-variant', 'feather', 'leaf']) {
      const layer = screen.getByTestId(`icon:mdi:${icon}`).parent!;
      expect(layer.props.importantForAccessibility).toBe('no-hide-descendants');
    }
    await advance(1800);
    expect(screen.getByRole('progressbar').props.accessibilityLabel).toBe(
      'Cargando…',
    );
  });

  it('announces the delay message once, when it appears', async () => {
    await render(<BrandLoader />);
    announce.mockClear();
    await advance(999);
    expect(announce).not.toHaveBeenCalled();
    await advance(1);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(
      'Cargando… Esto está tardando más de lo normal.',
    );
    await advance(5000); // several icon changes later
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it('never announces the delay message for the compact loader', async () => {
    await render(<BrandLoader size="compact" />);
    announce.mockClear();
    await advance(3000);
    expect(announce).not.toHaveBeenCalled();
  });

  it('uses English texts when the app is in English', async () => {
    await i18n.changeLanguage('en');
    await render(<BrandLoader />);
    await advance(1000);
    expect(screen.getByRole('progressbar').props.accessibilityLabel).toBe(
      'Loading…',
    );
    expect(announce).toHaveBeenCalledWith(
      'Loading… This is taking longer than usual.',
    );
  });
});

describe('BrandLoader reduce motion', () => {
  it('fades the icons normally', async () => {
    await render(<BrandLoader size="compact" />);
    const [book, feather, leaf] = opacities();
    expect(book).toBeGreaterThan(0);
    expect(book).toBeLessThan(1);
    expect([feather, leaf]).toEqual([0, 0]);
  });

  it('swaps icons with no fade: only 0 or 1, one icon at a time', async () => {
    mockReduced = true;
    await render(<BrandLoader size="compact" />);
    expect(opacities()).toEqual([1, 0, 0]);
  });
});
