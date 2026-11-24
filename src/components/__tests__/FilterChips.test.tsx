import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { MIN_TOUCH_TARGET } from '@/theme';
import { Button } from '../Button';
import { FilterChips } from '../FilterChips';

const noop = () => {};
const style = (node: { props: { style?: unknown } }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('labels are never clipped', () => {
  it('keeps short and long chip labels whole', async () => {
    await render(
      <FilterChips
        value={undefined}
        onChange={noop}
        options={[
          { value: undefined, label: 'All' },
          { value: 'a', label: 'A very long filter label' },
        ]}
      />,
    );
    expect(screen.getByText('All')).toBeOnTheScreen();
    expect(screen.getByText('A very long filter label')).toBeOnTheScreen();
  });

  it('does not let the chip or its label shrink', async () => {
    await render(
      <FilterChips value="a" onChange={noop} options={[{ value: 'a', label: 'All' }]} />,
    );
    const chip = screen.getByRole('button', { name: 'All' });
    expect(style(chip)).toMatchObject({ flexShrink: 0 });
    expect(Number(style(chip).minWidth)).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(style(screen.getByText('All'))).toMatchObject({ flexShrink: 0 });
  });

  it('gives a button label no fixed width', async () => {
    await render(<Button label="Ok" icon="user" onPress={noop} />);
    expect(style(screen.getByText('Ok')).width).toBeUndefined();
  });
});
