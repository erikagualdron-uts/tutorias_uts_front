import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { spacing } from '@/theme';
import i18n from '@/i18n';
import { DatePickerSheet } from '../DatePickerSheet';

const setup = async () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  await render(
    <DatePickerSheet
      title="Fecha de inicio"
      value={new Date(2027, 1, 5, 12)}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
};

beforeEach(async () => {
  jest.clearAllMocks();
  (useReducedMotion as jest.Mock).mockReturnValue(false);
  await i18n.changeLanguage('es');
});

describe('DatePickerSheet', () => {
  it('shows the title, the picker and both buttons with their icons', async () => {
    await setup();
    expect(screen.getByText('Fecha de inicio')).toBeTruthy();
    expect(screen.getByTestId('date-picker')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar')).toBeTruthy();
    expect(screen.getByLabelText('Cancelar')).toBeTruthy();
    expect(screen.getByTestId('icon:solar:check-circle-linear')).toBeTruthy();
    expect(screen.getByTestId('icon:solar:close-circle-linear')).toBeTruthy();
  });

  it('keeps 16 px between the stacked buttons', async () => {
    await setup();
    const sheet = screen.getByTestId('date-picker-sheet');
    expect(StyleSheet.flatten(sheet.props.style).gap).toBe(spacing.lg);
    expect(spacing.lg).toBe(16);
  });

  it('confirm returns the day the picker holds', async () => {
    const { onConfirm } = await setup();
    await fireEvent.press(screen.getByLabelText('Confirmar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0].getDate()).toBe(5);
  });

  it('cancel and tapping outside never confirm', async () => {
    const { onConfirm, onCancel } = await setup();
    await fireEvent.press(screen.getByLabelText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('slides in normally and only fades with reduce motion', async () => {
    await setup();
    expect(screen.getByTestId('date-picker-sheet').props.entering).toBe(
      FadeInDown,
    );
    (useReducedMotion as jest.Mock).mockReturnValue(true);
    await setup();
    const sheets = screen.getAllByTestId('date-picker-sheet');
    expect(sheets.at(-1)?.props.entering).toBe(FadeIn);
  });
});
