import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { Text } from 'react-native';
import { lightOnly, paintedColors } from '@/testing/darkColors';
import { EmptyState } from '../EmptyState';

afterEach(() => jest.restoreAllMocks());

const state = (
  <EmptyState
    title="Vacío"
    description="Nada por aquí"
    icon={<Text>ícono</Text>}
    action={<Text>acción</Text>}
  />
);

describe('EmptyState', () => {
  it('shows title, description, icon and action with the brand pattern', async () => {
    await render(state);
    for (const text of ['Vacío', 'Nada por aquí', 'ícono', 'acción'])
      expect(screen.getByText(text)).toBeOnTheScreen();
    expect(
      screen.getAllByTestId(/^icon:mdi:/, { includeHiddenElements: true }),
    ).toHaveLength(4);
  });

  it('paints no leftover of the light mode in dark', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    await render(state);
    expect(
      paintedColors(screen.toJSON() as never).filter((c) =>
        lightOnly.includes(c),
      ),
    ).toEqual([]);
  });
});
