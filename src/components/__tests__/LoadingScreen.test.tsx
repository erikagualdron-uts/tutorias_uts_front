import { act, configure, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { LoadingScreen } from '../LoadingScreen';

beforeAll(() => configure({ defaultIncludeHiddenElements: true }));

beforeEach(async () => {
  await i18n.changeLanguage('es');
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

describe('LoadingScreen', () => {
  it('keeps only the screen background for the first 300 ms, then shows the brand loader', async () => {
    await render(<LoadingScreen />);
    await advance(299);
    expect(screen.queryByTestId('icon:mdi:book-open-page-variant')).toBeNull();
    await advance(1);
    expect(screen.getByTestId('icon:mdi:book-open-page-variant')).toBeTruthy();
  });

  it('exposes one progress element with the translated label', async () => {
    await render(<LoadingScreen />);
    expect(screen.queryByRole('progressbar')).toBeNull(); // not announced before 300 ms
    await advance(300);
    const bar = screen.getByRole('progressbar');
    expect(bar.props.accessibilityLabel).toBe('Cargando…');
    expect(bar.props.accessibilityState).toEqual({ busy: true });
  });
});
