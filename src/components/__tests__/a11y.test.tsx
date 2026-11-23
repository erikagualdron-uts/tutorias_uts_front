import { isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { controlIssues } from '@/testing/a11y';
import { Icon } from '@/icons/Icon';
import { Button, IconButton } from '../Button';
import { SelectField } from '../SelectField';
import { TextAreaField } from '../TextAreaField';
import { TextField } from '../TextField';

// The global mock of Iconify drops its props; this one keeps them so the hiding can be seen.
jest.mock('react-native-iconify', () => {
  const { View } = jest.requireActual('react-native');
  return { Iconify: (props: object) => <View {...props} /> };
});

beforeEach(async () => {
  await i18n.changeLanguage('es');
});

describe('shared components for a screen reader', () => {
  it('announces the rule that blocks a disabled button, and only then', async () => {
    await render(
      <>
        <Button label="Inscribirme" icon="user" disabled helperText="El módulo está lleno" onPress={() => {}} />
        <Button label="Guardar" icon="user" helperText="No se usa" onPress={() => {}} />
      </>,
    );
    expect(screen.getByLabelText('Inscribirme').props.accessibilityHint).toBe('El módulo está lleno');
    expect(screen.getByLabelText('Guardar').props.accessibilityHint).toBeUndefined();
  });

  it('announces a field error with the field', async () => {
    await render(
      <>
        <TextField label="Correo" leadingIcon="email" error="Correo no válido" />
        <TextAreaField label="Descripción" leadingIcon="email" error="Es obligatoria" />
        <SelectField label="Tipo" leadingIcon="email" placeholder="Elegir" error="Elige un tipo" onPress={() => {}} />
      </>,
    );
    expect(screen.getByLabelText('Correo').props.accessibilityHint).toBe('Correo no válido');
    expect(screen.getByLabelText('Descripción').props.accessibilityHint).toBe('Es obligatoria');
    expect(screen.getByLabelText('Tipo').props.accessibilityHint).toBe('Elige un tipo');
  });

  it('reads the chosen value of a select', async () => {
    await render(<SelectField label="Tipo" leadingIcon="email" value="Petición" placeholder="Elegir" onPress={() => {}} />);
    expect(screen.getByLabelText('Tipo').props.accessibilityValue).toEqual({ text: 'Petición' });
  });

  it('has no control without name, role or the 48 px target', async () => {
    await render(
      <>
        <Button label="Guardar" icon="user" onPress={() => {}} />
        <Button label="Más" variant="link" onPress={() => {}} />
        <IconButton icon="user" label="Cerrar" onPress={() => {}} />
        <TextField label="Contraseña" leadingIcon="password" password />
        <SelectField label="Tipo" leadingIcon="email" placeholder="Elegir" onPress={() => {}} />
      </>,
    );
    expect(controlIssues()).toEqual([]);
  });

  it('hides an icon from the screen reader so only the text next to it is read', async () => {
    await render(<Icon name="user" />);
    expect(isHiddenFromAccessibility(screen.container.children[0] as never)).toBe(true);
  });
});
