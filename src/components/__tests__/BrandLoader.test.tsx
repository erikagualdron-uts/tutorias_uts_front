import { act, configure, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { darkPalette, lightPalette } from '@/theme/colors';
import { BrandLoader } from '../BrandLoader';

// The real Icon hides its color; this stand-in exposes it so the tests can read it.
jest.mock('@/icons/Icon', () => ({
  Icon: ({
    name,
    color,
    size,
  }: {
    name: string;
    color?: string;
    size?: number;
  }) => {
    const { Text } = jest.requireActual('react-native');
    return (
      <Text testID={`icon:${name}`} accessibilityHint={`${color}|${size}`} />
    );
  },
}));

let mockScheme: 'light' | 'dark' = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

beforeAll(() => configure({ defaultIncludeHiddenElements: true }));

beforeEach(async () => {
  await i18n.changeLanguage('es');
  jest.useFakeTimers();
  mockScheme = 'light';
});
afterEach(() => jest.useRealTimers());

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
const ICONS = ['openBook', 'feather', 'leaf'];
const painted = () => ICONS.filter((n) => screen.queryByTestId(`icon:${n}`));

describe('BrandLoader regular', () => {
  it('paints nothing for the first 300 ms', async () => {
    await render(<BrandLoader />);
    await advance(299);
    expect(painted()).toEqual([]);
    expect(screen.queryByText(/tardando/)).toBeNull();
  });

  it('shows the three brand icons in the order book, feather, leaf after 300 ms, without a message', async () => {
    await render(<BrandLoader />);
    await advance(300);
    expect(painted()).toEqual(['openBook', 'feather', 'leaf']);
    const order = screen
      .getAllByTestId(/^icon:/)
      .map((n) => n.props.testID.replace('icon:', ''));
    expect(order).toEqual(['openBook', 'feather', 'leaf']);
    expect(screen.queryByText(/tardando/)).toBeNull();
  });

  it('adds the delay message after 1000 ms and cancels its timers when it unmounts', async () => {
    const cancel = jest.spyOn(global, 'clearTimeout');
    const { unmount } = await render(<BrandLoader />);
    await advance(1000);
    expect(
      screen.getByText('Cargando… Esto está tardando más de lo normal.'),
    ).toBeTruthy();
    cancel.mockClear();
    await unmount();
    expect(cancel).toHaveBeenCalled();
    cancel.mockRestore();
  });

  it('uses 48 px icons', async () => {
    await render(<BrandLoader />);
    await advance(300);
    expect(screen.getByTestId('icon:openBook').props.accessibilityHint).toMatch(
      /\|48$/,
    );
  });
});

describe('BrandLoader compact', () => {
  it('shows right away, at 20 px, and never shows the delay message', async () => {
    await render(<BrandLoader size="compact" />);
    expect(painted()).toEqual(['openBook', 'feather', 'leaf']);
    expect(screen.getByTestId('icon:openBook').props.accessibilityHint).toMatch(
      /\|20$/,
    );
    await advance(1500);
    expect(screen.queryByText(/tardando/)).toBeNull();
  });
});

describe('BrandLoader color', () => {
  it('is the primary green on light surfaces', async () => {
    await render(<BrandLoader size="compact" />);
    expect(screen.getByTestId('icon:leaf').props.accessibilityHint).toMatch(
      new RegExp(`^${lightPalette.primary}\\|`),
    );
  });

  it('is near-white, not lime, on dark surfaces', async () => {
    mockScheme = 'dark';
    await render(<BrandLoader size="compact" />);
    expect(screen.getByTestId('icon:leaf').props.accessibilityHint).toMatch(
      new RegExp(`^${darkPalette.textPrimary}\\|`),
    );
  });

  it('takes the color it is given, as filled buttons do', async () => {
    await render(<BrandLoader size="compact" color="#FFFFFF" />);
    expect(screen.getByTestId('icon:leaf').props.accessibilityHint).toMatch(
      /^#FFFFFF\|/,
    );
  });
});
