import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import i18n from '@/i18n';
import { dayToDate, toDay, todayInBogota } from '@/date/day';
import { DateField } from '../DateField';

const picker = jest.requireMock('@react-native-community/datetimepicker') as {
  default: { lastProps?: Record<string, any> };
  DateTimePickerAndroid: { open: jest.Mock };
};
const androidOpen = picker.DateTimePickerAndroid.open;

// Chooses a day in the iOS picker, as the person would by spinning it.
const spinTo = (day: string) =>
  act(async () => {
    picker.default.lastProps?.onValueChange({}, dayToDate(day));
  });

// Host TextInputs on screen: the date fields must have none, so no keyboard can open.
const textInputCount = () =>
  (JSON.stringify(screen.toJSON()).match(/"type":"TextInput"/g) ?? []).length;

const setup = async (props: Partial<Parameters<typeof DateField>[0]> = {}) => {
  const onChange = jest.fn();
  const utils = await render(
    <DateField
      label="Fecha de inicio"
      value=""
      placeholder="dd/mm/aaaa"
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange, ...utils };
};

beforeEach(async () => {
  jest.clearAllMocks();
  picker.default.lastProps = undefined;
  await i18n.changeLanguage('es');
});

describe('DateField (iOS sheet)', () => {
  it('shows the placeholder and no keyboard field when empty', async () => {
    await setup();
    expect(screen.getByText('dd/mm/aaaa')).toBeTruthy();
    expect(textInputCount()).toBe(0);
  });

  it('opens the picker when pressed', async () => {
    await setup();
    expect(screen.queryByTestId('date-picker')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    expect(screen.getByTestId('date-picker')).toBeTruthy();
  });

  it('confirming returns YYYY-MM-DD once and shows dd/mm/YYYY', async () => {
    const { onChange, rerender } = await setup();
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    await spinTo('2027-02-05');
    await fireEvent.press(screen.getByLabelText('Confirmar'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2027-02-05');
    expect(screen.queryByTestId('date-picker')).toBeNull();
    await rerender(
      <DateField
        label="Fecha de inicio"
        value="2027-02-05"
        placeholder="dd/mm/aaaa"
        onChange={onChange}
      />,
    );
    expect(screen.getByText('05/02/2027')).toBeTruthy();
  });

  it('cancelling keeps the previous value', async () => {
    const { onChange } = await setup({ value: '2027-02-05' });
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    await spinTo('2027-03-10');
    await fireEvent.press(screen.getByLabelText('Cancelar'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('date-picker')).toBeNull();
    expect(screen.getByText('05/02/2027')).toBeTruthy();
  });

  it('opens on the current value', async () => {
    await setup({ value: '2027-02-05' });
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    expect(toDay(picker.default.lastProps?.value)).toBe('2027-02-05');
  });

  it('opens on today in Bogota when empty', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    expect(toDay(picker.default.lastProps?.value)).toBe(todayInBogota());
  });

  it('confirming without moving the picker keeps the opening date', async () => {
    const { onChange } = await setup({ value: '2027-02-05' });
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    await fireEvent.press(screen.getByLabelText('Confirmar'));
    expect(onChange).toHaveBeenCalledWith('2027-02-05');
  });

  it('shows the placeholder, not "Invalid date", for a bad value', async () => {
    await setup({ value: 'basura' });
    expect(screen.getByText('dd/mm/aaaa')).toBeTruthy();
    expect(screen.queryByText(/invalid/i)).toBeNull();
  });

  it('shows the same dd/mm/YYYY format in English', async () => {
    await i18n.changeLanguage('en');
    await setup({ value: '2026-12-31', placeholder: 'dd/mm/yyyy' });
    expect(screen.getByText('31/12/2026')).toBeTruthy();
  });
});

describe('DateField (Android dialog)', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });
  afterEach(() => jest.restoreAllMocks());

  it('opens the system dialog on the current value', async () => {
    await setup({ value: '2027-02-05' });
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    expect(androidOpen).toHaveBeenCalledTimes(1);
    const options = androidOpen.mock.calls[0][0];
    expect(options.mode).toBe('date');
    expect(toDay(options.value)).toBe('2027-02-05');
    expect(screen.queryByTestId('date-picker')).toBeNull();
  });

  it('returns the chosen day once', async () => {
    const { onChange } = await setup();
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    await act(async () => {
      androidOpen.mock.calls[0][0].onValueChange({}, dayToDate('2027-02-05'));
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2027-02-05');
  });

  it('dismissing keeps the value', async () => {
    const { onChange } = await setup({ value: '2027-02-05' });
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    await act(async () => {
      androidOpen.mock.calls[0][0].onDismiss();
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('05/02/2027')).toBeTruthy();
  });
});

describe('DateField limits and rule', () => {
  const openAndRead = async () => {
    await fireEvent.press(screen.getByLabelText('Fecha de inicio'));
    return picker.default.lastProps as Record<string, any>;
  };

  it('hands minDate and maxDate to the picker as inclusive limits', async () => {
    await setup({ minDate: '2027-02-02', maxDate: '2027-02-20' });
    const props = await openAndRead();
    expect(toDay(props.minimumDate)).toBe('2027-02-02');
    expect(toDay(props.maximumDate)).toBe('2027-02-20');
  });

  it('shows the rule under the field', async () => {
    await setup({ hint: 'Debe ser posterior a la fecha de inicio.' });
    expect(
      screen.getByText('Debe ser posterior a la fecha de inicio.'),
    ).toBeTruthy();
  });

  it('shows the error instead of the rule on the same line', async () => {
    await setup({ hint: 'La regla', error: 'El error' });
    expect(screen.getByText('El error')).toBeTruthy();
    expect(screen.queryByText('La regla')).toBeNull();
  });

  it('opens on the nearest allowed day when today is outside the range', async () => {
    await setup({ minDate: '2999-01-10' });
    expect(toDay((await openAndRead()).value)).toBe('2999-01-10');
  });

  it('opens on the maximum when today is after it', async () => {
    await setup({ maxDate: '2001-05-04' });
    expect(toDay((await openAndRead()).value)).toBe('2001-05-04');
  });

  it('keeps a value that is already inside the range', async () => {
    await setup({
      value: '2027-02-05',
      minDate: '2027-02-01',
      maxDate: '2027-02-28',
    });
    expect(toDay((await openAndRead()).value)).toBe('2027-02-05');
  });
});
