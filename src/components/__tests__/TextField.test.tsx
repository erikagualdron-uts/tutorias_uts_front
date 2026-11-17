import { fireEvent, render, screen } from '@testing-library/react-native';
import { darkPalette, lightPalette } from '@/theme/colors';
import { fieldVisual } from '../FieldBox';
import { SearchField } from '../SearchField';
import { TextField } from '../TextField';

const rest = { focused: false, error: false, disabled: false, onCard: true };

describe('fieldVisual', () => {
  it('rests with a fill and a soft 1 px border', () => {
    const v = fieldVisual(rest, lightPalette);
    expect(v).toMatchObject({
      backgroundColor: '#F2F4EF',
      borderColor: '#C9D0C3',
      borderWidth: 1,
      showGlow: false,
    });
  });

  it('uses a white fill on the screen background', () => {
    expect(
      fieldVisual({ ...rest, onCard: false }, lightPalette).backgroundColor,
    ).toBe('#FFFFFF');
  });

  it('focus gives a 2 px green border, white fill, glow and label color', () => {
    expect(fieldVisual({ ...rest, focused: true }, lightPalette)).toMatchObject(
      {
        borderColor: '#4E7A2F',
        borderWidth: 2,
        backgroundColor: '#FFFFFF',
        showGlow: true,
        labelColor: '#34531F',
      },
    );
  });

  it('error wins over focus', () => {
    expect(
      fieldVisual({ ...rest, focused: true, error: true }, lightPalette),
    ).toMatchObject({ borderColor: '#B3261E', borderWidth: 1 });
  });

  it('disabled is 60% opaque with no glow', () => {
    expect(
      fieldVisual({ ...rest, disabled: true, focused: true }, lightPalette),
    ).toMatchObject({ opacity: 0.6, showGlow: false });
  });

  it('dark mode uses the dark fill and border', () => {
    expect(fieldVisual(rest, darkPalette)).toMatchObject({
      backgroundColor: '#0B1710',
      borderColor: 'rgba(255,255,255,0.16)',
    });
  });
});

describe('TextField', () => {
  it('shows the leading icon and the error line with an error icon', async () => {
    await render(
      <TextField
        label="Correo"
        leadingIcon="email"
        error="Correo inválido"
        value=""
        onChangeText={() => {}}
      />,
    );
    expect(screen.getByTestId('icon:solar:letter-linear')).toBeTruthy();
    expect(screen.getByText('Correo inválido')).toBeTruthy();
    expect(screen.getByTestId('icon:solar:close-circle-linear')).toBeTruthy();
  });

  it('toggles password visibility', async () => {
    await render(
      <TextField
        label="Clave"
        leadingIcon="password"
        password
        value="x"
        onChangeText={() => {}}
      />,
    );
    const input = screen.getByLabelText('Clave');
    expect(input.props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByRole('button'));
    expect(screen.getByLabelText('Clave').props.secureTextEntry).toBe(false);
  });

  it('is not editable when disabled', async () => {
    await render(
      <TextField
        label="Nombre"
        leadingIcon="user"
        editable={false}
        value=""
        onChangeText={() => {}}
      />,
    );
    expect(screen.getByLabelText('Nombre').props.editable).toBe(false);
  });
});

describe('SearchField', () => {
  it('has a leading search icon and clears the text', async () => {
    const onClear = jest.fn();
    await render(
      <SearchField
        label="Buscar"
        value="abc"
        onChangeText={() => {}}
        onClear={onClear}
      />,
    );
    expect(screen.getByTestId('icon:solar:magnifier-linear')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(onClear).toHaveBeenCalled();
  });
});
