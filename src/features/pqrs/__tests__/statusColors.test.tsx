import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { StyleSheet } from 'react-native';
import i18n from '@/i18n';
import { darkPalette, lightPalette } from '@/theme/colors';
import { StatusBadge } from '../components/StatusBadge';

afterEach(() => jest.restoreAllMocks());

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
] as const)('PQRS status badge in %s mode', (mode, palette) => {
  beforeEach(() => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(mode);
  });

  it.each([
    ['RESOLVED', palette.successText],
    ['IN_REVIEW', palette.warningText],
    ['FILED', palette.primary],
  ] as const)('draws %s with its text role', async (status, color) => {
    await render(<StatusBadge status={status} />);
    const badge = screen.getByText(i18n.t(`pqrs.status.${status}`)).parent;
    expect(StyleSheet.flatten(badge?.props.style).borderColor).toBe(color);
  });
});
