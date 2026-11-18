import {
  act,
  configure,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import '@/i18n';
import { Button } from '../Button';

describe('Button', () => {
  it('calls onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Send" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows the blocking rule and ignores presses when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button
        label="Send"
        onPress={onPress}
        disabled
        helperText="Rule that blocks it"
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByText('Rule that blocks it')).toBeTruthy();
  });

  it('ignores presses while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Send" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Button icon', () => {
  it('shows the leading icon next to the label', async () => {
    await render(<Button label="Send" icon="signIn" onPress={jest.fn()} />);
    expect(screen.getByTestId('icon:solar:login-3-linear')).toBeTruthy();
  });

  it('shows no icon on links', async () => {
    await render(
      <Button label="Help" icon="signIn" variant="link" onPress={jest.fn()} />,
    );
    expect(screen.queryByTestId('icon:solar:login-3-linear')).toBeNull();
  });
});

describe('Button loading', () => {
  beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('replaces the icon with the compact brand loader at once, with no delay message', async () => {
    await render(
      <Button label="Send" icon="signIn" onPress={jest.fn()} loading />,
    );
    // no 300 ms wait: the three brand icons are painted on the first render
    expect(screen.getByTestId('icon:mdi:book-open-page-variant')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.queryByText(/tardando|longer than usual/)).toBeNull();
  });

  it('keeps its content in the same box so the width does not change', async () => {
    await render(
      <Button label="Send" icon="signIn" onPress={jest.fn()} loading />,
    );
    expect(screen.getByText('Send')).toBeTruthy();
    expect(screen.getByTestId('icon:solar:login-3-linear')).toBeTruthy();
  });

  it('does not repeat the action while loading and goes back to normal afterwards', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(
      <Button label="Send" onPress={onPress} loading />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(onPress).not.toHaveBeenCalled();
    await rerender(<Button label="Send" onPress={onPress} />);
    expect(screen.queryByTestId('icon:mdi:book-open-page-variant')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Button loading ring', () => {
  beforeAll(() => configure({ defaultIncludeHiddenElements: true }));

  it('shows the 28 px ring with the icon, fading in and out for 150 ms and never shaking', async () => {
    await render(
      <Button label="Send" icon="signIn" onPress={jest.fn()} loading />,
    );
    expect(screen.getByTestId('loader-ring-arc').props.r).toBe(13);
    const bar = screen.getByRole('progressbar');
    expect([bar.props.entering.name, bar.props.entering.durationMs]).toEqual([
      'FadeIn',
      150,
    ]);
    expect([bar.props.exiting.name, bar.props.exiting.durationMs]).toEqual([
      'FadeOut',
      150,
    ]);
  });
});
