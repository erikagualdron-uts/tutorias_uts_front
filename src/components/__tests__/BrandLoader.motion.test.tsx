import {
  act,
  configure,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';
import i18n from '@/i18n';
import { BrandLoader } from '../BrandLoader';

beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
beforeEach(async () => {
  await i18n.changeLanguage('es');
  (useReducedMotion as jest.Mock).mockReturnValue(false);
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

interface Recorded {
  name: string;
  durationMs?: number;
}
const root = () => screen.getByRole('progressbar').props;
describe('BrandLoader ring', () => {
  it('shows the ring around the icon: 64 px for screens and 28 px for buttons', async () => {
    await render(<BrandLoader />);
    await advance(300);
    expect(screen.getByTestId('loader-ring-track').props.r).toBeCloseTo(30.5);
    await render(<BrandLoader size="compact" />);
    expect(screen.getAllByTestId('loader-ring-track').at(-1)?.props.r).toBe(13);
  });

  it('gives the ring the same color as the icon', async () => {
    await render(<BrandLoader size="compact" color="#FEDCBA" />);
    expect(screen.getByTestId('loader-ring-arc').props.stroke).toBe('#FEDCBA');
    expect(screen.getByTestId('loader-ring-track').props.stroke).toBe(
      '#FEDCBA',
    );
  });

  it('reserves the 64 px (28 px compact) before 300 ms without painting the ring', async () => {
    const { toJSON } = await render(<BrandLoader />);
    await advance(299);
    expect(screen.queryByTestId('loader-ring-track')).toBeNull();
    expect(
      (toJSON() as unknown as { props: { style: object } }).props.style,
    ).toEqual({
      width: 64,
      height: 64,
    });
  });
});

describe('BrandLoader entrance and exit', () => {
  it('the whole loader fades in and out for 150 ms', async () => {
    await render(<BrandLoader />);
    await advance(300);
    const { entering, exiting } = root() as {
      entering: Recorded;
      exiting: Recorded;
    };
    expect([entering.name, entering.durationMs]).toEqual(['FadeIn', 150]);
    expect([exiting.name, exiting.durationMs]).toEqual(['FadeOut', 150]);
  });

  it('plays no entrance, and keeps no animation pending, when the load ends before 300 ms', async () => {
    const { unmount, toJSON } = await render(<BrandLoader />);
    await advance(200);
    expect(
      (toJSON() as unknown as { props: Record<string, unknown> }).props
        .entering,
    ).toBeUndefined();
    await unmount();
    await advance(2000);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('takes the delay message out with the rest of the loader', async () => {
    await render(<BrandLoader />);
    await advance(1000);
    const bar = screen.getByRole('progressbar');
    expect(bar.props.exiting).toBeTruthy();
    expect(within(bar).getByText(/tardando/)).toBeTruthy();
  });
});

describe('BrandLoader with reduce motion', () => {
  beforeEach(() => (useReducedMotion as jest.Mock).mockReturnValue(true));

  it('enters and leaves with a 150 ms fade, on screens too', async () => {
    await render(<BrandLoader />);
    await advance(300);
    const { entering, exiting } = root() as {
      entering: Recorded;
      exiting: Recorded;
    };
    expect([entering.name, entering.durationMs]).toEqual(['FadeIn', 150]);
    expect([exiting.name, exiting.durationMs]).toEqual(['FadeOut', 150]);
  });

  it('keeps the waiting phases and the delay message', async () => {
    await render(<BrandLoader />);
    await advance(299);
    expect(screen.queryByRole('progressbar')).toBeNull();
    await advance(701);
    expect(screen.getByText(/tardando/)).toBeTruthy();
  });
});
