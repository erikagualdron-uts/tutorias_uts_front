import { render, screen } from '@testing-library/react-native';
import { Banner } from '../Banner';
import { Button } from '../Button';
import { lightPalette } from '@/theme/colors';

describe('Banner severity', () => {
  it.each([
    ['info', lightPalette.surfaceWarm],
    ['success', lightPalette.success],
    ['warning', lightPalette.warning],
    ['error', lightPalette.error],
  ] as const)('%s is an alert with its own fill', async (severity, fill) => {
    await render(<Banner message="Algo pasó" severity={severity} />);
    const box = screen.getByText('Algo pasó').parent;
    expect(box?.props.accessibilityRole).toBe('alert');
    expect(box).toHaveStyle({ backgroundColor: fill });
  });

  it('is the quiet cream notice by default', async () => {
    await render(<Banner message="Aviso" />);
    expect(screen.getByText('Aviso').parent).toHaveStyle({
      backgroundColor: lightPalette.surfaceWarm,
    });
  });
});

describe('Button severity', () => {
  it.each([
    ['success', lightPalette.success],
    ['warning', lightPalette.warning],
    ['destructive', lightPalette.error],
  ] as const)('%s has its own fill', async (variant, fill) => {
    await render(
      <Button
        label="Acción"
        icon="trash"
        variant={variant}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Acción' })).toHaveStyle({
      backgroundColor: fill,
    });
  });
});
