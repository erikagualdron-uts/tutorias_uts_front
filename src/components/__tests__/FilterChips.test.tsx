import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { MIN_TOUCH_TARGET } from '@/theme';
import { lightPalette } from '@/theme/colors';
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
    expect(style(screen.getByText('All'))).toMatchObject({ flexShrink: 0, letterSpacing: 0 });
    expect(Number(style(screen.getByText('All')).paddingHorizontal)).toBeGreaterThan(0);
  });

  it('gives a button label no fixed width', async () => {
    await render(<Button label="Ok" icon="user" onPress={noop} />);
    expect(style(screen.getByText('Ok')).width).toBeUndefined();
  });
});

describe('compact scrolling row', () => {
  const options = [
    { value: undefined, label: 'All' },
    { value: 'a', label: 'Filed' },
    { value: 'b', label: 'Resolved' },
  ];

  it('scrolls sideways without a bar and keeps every chip', async () => {
    await render(<FilterChips scroll value="a" onChange={noop} options={options} />);
    const row = screen.toJSON() as { type: string; props: Record<string, unknown> };
    expect(row.type).toBe('RCTScrollView');
    expect(row.props.horizontal).toBe(true);
    expect(row.props.showsHorizontalScrollIndicator).toBe(false);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('is 36 px tall with a touch area that adds up to 48 px', async () => {
    await render(<FilterChips scroll value="a" onChange={noop} options={options} />);
    const chip = screen.getByRole('button', { name: 'Filed' });
    const { top, bottom } = chip.props.hitSlop as { top: number; bottom: number };
    expect(style(chip).minHeight).toBe(36);
    expect(36 + top + bottom).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  it('keeps the brand fill on the selected chip', async () => {
    await render(<FilterChips scroll value="a" onChange={noop} options={options} />);
    expect(style(screen.getByRole('button', { name: 'Filed' })).backgroundColor).toBe(lightPalette.primary);
    expect(style(screen.getByText('Filed')).color).toBe(lightPalette.onPrimary);
  });

  it('keeps the wrapping row and 48 px chips without scroll', async () => {
    await render(<FilterChips value="a" onChange={noop} options={options} />);
    expect((screen.toJSON() as { type: string }).type).toBe('View');
    expect(style(screen.getByRole('button', { name: 'Filed' })).minHeight).toBe(MIN_TOUCH_TARGET);
  });
});
