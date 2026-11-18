import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import '@/i18n';
import { AuthLayout } from '../AuthLayout';
import { BrandLogo } from '../BrandLogo';

jest.mock('expo-image', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    Image: (props: Record<string, unknown>) => (
      <View testID="brand-logo" {...props} />
    ),
  };
});

const lightLogo = require('../../../assets/brand/logo-uts-no-bg-letras-blancas.png');
const darkLogo = require('../../../assets/brand/logo-uts-blanco.png');

function mockScheme(scheme: 'light' | 'dark') {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);
}

afterEach(() => jest.restoreAllMocks());

describe('BrandLogo', () => {
  it('uses the lime-symbol variant in light theme', async () => {
    mockScheme('light');
    await render(<BrandLogo width={200} />);
    expect(screen.getByTestId('brand-logo').props.source).toBe(lightLogo);
  });

  it('uses the all-white variant in dark theme', async () => {
    mockScheme('dark');
    await render(<BrandLogo width={200} />);
    expect(screen.getByTestId('brand-logo').props.source).toBe(darkLogo);
  });

  it('keeps the real 1448:1086 ratio and is hidden from screen readers', async () => {
    mockScheme('light');
    await render(<BrandLogo width={120} />);
    const logo = screen.getByTestId('brand-logo');
    expect(ReactNative.StyleSheet.flatten(logo.props.style)).toEqual({
      width: 120,
      aspectRatio: 1448 / 1086,
    });
    expect(logo.props.contentFit).toBe('contain');
    expect(logo.props.accessible).toBe(false);
  });
});

describe('AuthLayout logo', () => {
  it('sits directly on the gradient, with no filled badge behind it', async () => {
    mockScheme('light');
    await render(<AuthLayout title="t">{null}</AuthLayout>);
    const parent = screen.getByTestId('brand-logo').parent;
    const style = ReactNative.StyleSheet.flatten(parent?.props.style) ?? {};
    expect(style.backgroundColor).toBeUndefined();
  });
});
