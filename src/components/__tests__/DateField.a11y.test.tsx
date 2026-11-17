import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import i18n from '@/i18n';
import { MIN_TOUCH_TARGET } from '@/theme';
import { DateField } from '../DateField';

const setup = async (props: Partial<Parameters<typeof DateField>[0]> = {}) =>
  render(
    <DateField
      label="Fecha de inicio"
      value=""
      placeholder="dd/mm/aaaa"
      onChange={() => {}}
      {...props}
    />,
  );

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('es');
});

describe('DateField accessibility', () => {
  it('announces its label, its value and what it does', async () => {
    await setup({ value: '2027-02-05' });
    const field = screen.getByLabelText('Fecha de inicio');
    expect(field.props.accessibilityRole).toBe('button');
    expect(field.props.accessibilityValue).toEqual({ text: '05/02/2027' });
    expect(field.props.accessibilityHint).toBe('Abre un selector de fecha');
  });

  it('says "Sin seleccionar" when it is empty and the English text in English', async () => {
    await setup();
    expect(
      screen.getByLabelText('Fecha de inicio').props.accessibilityValue,
    ).toEqual({ text: 'Sin seleccionar' });
  });

  it('uses English texts when the device is in English', async () => {
    await i18n.changeLanguage('en');
    await setup({ label: 'Start date' });
    const field = screen.getByLabelText('Start date');
    expect(field.props.accessibilityValue).toEqual({ text: 'Not selected' });
    expect(field.props.accessibilityHint).toBe('Opens a date picker');
  });

  it('has a touch target of at least 48 px', async () => {
    await setup();
    const style = StyleSheet.flatten(
      screen.getByLabelText('Fecha de inicio').props.style,
    );
    expect(style.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  it('is disabled: announced as such and it does not open the picker', async () => {
    await setup({ disabled: true });
    const field = screen.getByLabelText('Fecha de inicio');
    expect(field.props.accessibilityState).toEqual({ disabled: true });
    await fireEvent.press(field);
    expect(screen.queryByTestId('date-picker')).toBeNull();
  });

  it('says the error with text and an icon, not only color', async () => {
    await setup({ error: 'Elige una fecha válida.' });
    expect(screen.getByText('Elige una fecha válida.')).toBeTruthy();
    expect(screen.getByTestId('icon:solar:close-circle-linear')).toBeTruthy();
  });

  it('shows the leading calendar icon', async () => {
    await setup();
    expect(screen.getByTestId('icon:solar:calendar-mark-linear')).toBeTruthy();
  });
});
