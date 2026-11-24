import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { StatusStackBar } from '@/features/dashboard/components/StatusStackBar';
import { darkPalette, lightPalette } from '@/theme/colors';
import { fieldVisual } from '../FieldBox';

afterEach(() => jest.restoreAllMocks());

const fill = (id: string) =>
  ReactNative.StyleSheet.flatten(screen.getByTestId(id).props.style) as { backgroundColor: string };

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
] as const)('admin indicators in %s mode', (mode, palette) => {
  beforeEach(() =>
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(mode),
  );

  it('paints the PQRS bar segments with text roles', async () => {
    await render(<StatusStackBar counts={{ FILED: 1, IN_REVIEW: 2, RESOLVED: 3 }} onSelect={() => {}} />);
    expect(fill('segment-IN_REVIEW').backgroundColor).toBe(palette.warningText);
    expect(fill('segment-RESOLVED').backgroundColor).toBe(palette.successText);
  });

  it('draws the border of a field with an error with errorText', () => {
    const state = { focused: false, error: 'x', disabled: false, onCard: true };
    expect(fieldVisual(state as never, palette).borderColor).toBe(palette.errorText);
  });
});
