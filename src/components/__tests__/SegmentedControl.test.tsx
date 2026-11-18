import { fireEvent, render, screen } from '@testing-library/react-native';
import { SegmentedControl } from '../SegmentedControl';

const options = [
  { value: 'day' as const, label: 'Día', icon: 'list' as const },
  { value: 'week' as const, label: 'Semana', icon: 'dateRange' as const },
];

describe('SegmentedControl', () => {
  it('marks the selected option for screen readers and names the group', async () => {
    await render(<SegmentedControl label="Vista" options={options} value="week" onChange={() => undefined} />);
    expect(screen.getByLabelText('Vista')).toBeTruthy();
    expect(screen.getByLabelText('Semana').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Día').props.accessibilityState.selected).toBe(false);
  });

  it('reports the option pressed', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl label="Vista" options={options} value="week" onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText('Día'));
    expect(onChange).toHaveBeenCalledWith('day');
  });

  it('keeps each option as tall as a touch target', async () => {
    await render(<SegmentedControl label="Vista" options={options} value="day" onChange={() => undefined} />);
    expect(screen.getByLabelText('Día')).toHaveStyle({ minHeight: 48 });
  });
});
