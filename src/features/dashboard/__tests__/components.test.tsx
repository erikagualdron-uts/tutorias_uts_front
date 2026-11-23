import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { ApiError } from '@/api/errors';
import i18n from '@/i18n';
import { lightPalette } from '@/theme/colors';
import { BlockState } from '../components/BlockState';
import { CapacityBar } from '../components/CapacityBar';
import { MetricCard } from '../components/MetricCard';

const fill = () => StyleSheet.flatten(screen.getByTestId('capacity-fill').props.style) as { width: string; backgroundColor: string };

beforeEach(() => i18n.changeLanguage('es'));

describe('CapacityBar', () => {
  it.each([
    [18, 30, lightPalette.primary], // 60 %
    [24, 30, lightPalette.warning], // 80 %
    [29, 30, lightPalette.warning], // 96.7 %
    [30, 30, lightPalette.textSecondary], // full
  ])('colors %i of %i by the capacity rules', async (value, max, color) => {
    await render(<CapacityBar label="Cálculo" value={value} max={max} />);
    expect(fill().backgroundColor).toBe(color);
    expect(screen.getByText(`${value}/${max}`)).toBeTruthy();
  });

  it('writes the numbers, caps the fill at 100 % and survives a zero capacity', async () => {
    await render(<CapacityBar label="Sala" value={40} max={30} valueText="100 %" />);
    expect(fill().width).toBe('100%');
    expect(screen.getByLabelText('Sala 100 %')).toBeTruthy();
    await render(<CapacityBar label="Vacía" value={0} max={0} />);
    expect(fill().width).toBe('0%');
  });
});

describe('MetricCard', () => {
  it('speaks the final value from the first frame while the number counts', async () => {
    await render(<MetricCard value={40} label="Estudiantes activos" />);
    expect(screen.getByLabelText('40 Estudiantes activos')).toBeTruthy();
  });

  it('shows the number and the label, and presses only when it leads somewhere', async () => {
    const onPress = jest.fn();
    await render(<MetricCard value={7} label="Estudiantes activos" onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText('7 Estudiantes activos'));
    expect(onPress).toHaveBeenCalledTimes(1);
    await render(<MetricCard value="—" label="Sin enlace" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByLabelText('— Sin enlace')).toBeTruthy();
  });
});

describe('BlockState', () => {
  const base = { isPending: false, isError: false, error: null, refetch: jest.fn() };

  it('shows the data, the empty sentence, and neither while loading', async () => {
    const { rerender } = await render(<BlockState query={base}><Text>datos</Text></BlockState>);
    expect(screen.getByText('datos')).toBeTruthy();
    await rerender(<BlockState query={base} emptyText="Nada por aquí"><Text>datos</Text></BlockState>);
    expect(screen.getByText('Nada por aquí')).toBeTruthy();
    expect(screen.queryByText('datos')).toBeNull();
    await rerender(<BlockState query={{ ...base, isPending: true }}><Text>datos</Text></BlockState>);
    expect(screen.queryByText('datos')).toBeNull();
  });

  it('explains the error and retries', async () => {
    const refetch = jest.fn();
    await render(<BlockState query={{ ...base, isError: true, error: new ApiError(500, 'INTERNAL_ERROR'), refetch }}><Text>datos</Text></BlockState>);
    expect(screen.getByText('No pudimos cargar este bloque')).toBeTruthy();
    await fireEvent.press(screen.getByText('Intentar de nuevo'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
