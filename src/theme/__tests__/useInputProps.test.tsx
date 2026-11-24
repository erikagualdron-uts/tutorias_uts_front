import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette } from '../colors';
import { useInputProps, useRefreshColors } from '..';

jest.mock('react-native/Libraries/Utilities/useColorScheme');
const scheme = jest.mocked(useColorScheme);

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
] as const)('native controls in %s mode', (mode, palette) => {
  beforeEach(() => scheme.mockReturnValue(mode));

  it('themes the text input', async () => {
    const { result } = await renderHook(() => useInputProps());
    expect(result.current).toEqual({
      placeholderTextColor: palette.inputPlaceholder,
      selectionColor: palette.inputBorderFocus,
      keyboardAppearance: mode,
    });
  });

  it('themes the refresh spinner', async () => {
    const { result } = await renderHook(() => useRefreshColors());
    expect(result.current.progressBackgroundColor).toBe(palette.card);
  });
});
