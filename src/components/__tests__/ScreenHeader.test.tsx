import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { contrast } from '@/testing/contrast';
import { gradients, onGradient } from '@/theme';
import { ScreenHeader } from '../ScreenHeader';

const color = (node: { props: { style?: unknown } }) =>
  (StyleSheet.flatten(node.props.style as never) as { color: string }).color;

describe('ScreenHeader', () => {
  it('shows the title as a header and the count as its own text', async () => {
    await render(<ScreenHeader title="Salones" count={17} />);
    expect(screen.getByRole('header', { name: 'Salones' })).toBeOnTheScreen();
    expect(screen.getByText('17')).toBeOnTheScreen();
  });

  it('shows a zero count and omits an absent one', async () => {
    await render(<ScreenHeader title="Salones" count={0} />);
    expect(screen.getByText('0')).toBeOnTheScreen();
    await screen.unmount();
    await render(<ScreenHeader title="Más" />);
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });

  it('paints the text with onGradient over the brand gradient', async () => {
    await render(<ScreenHeader title="Salones" count={3} />);
    expect(color(screen.getByText('Salones'))).toBe(onGradient.text);
    expect(color(screen.getByText('3'))).toBe(onGradient.text);
  });

  it.each(gradients.brand.colors)('has 4.5:1 text contrast on %s', (end) => {
    expect(contrast(onGradient.text, end)).toBeGreaterThanOrEqual(4.5);
  });
});
