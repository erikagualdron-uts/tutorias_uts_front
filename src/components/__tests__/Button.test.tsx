import { fireEvent, render, screen } from '@testing-library/react-native';
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
