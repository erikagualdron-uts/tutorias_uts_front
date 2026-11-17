import { render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import RootLayout from '../../app/_layout';
import { useAppFonts } from '@/theme';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  function Stack() {
    return <View testID="stack" />;
  }
  Stack.Screen = function Screen() {
    return null;
  };
  return { Stack };
});
jest.mock('@/store/useRestoreSession', () => ({
  useRestoreSession: jest.fn(),
}));
jest.mock('@/i18n', () => ({ useSyncDeviceLanguage: jest.fn() }));
jest.mock('@/theme', () => ({
  ...jest.requireActual('@/theme'),
  useAppFonts: jest.fn(),
}));

const mockFonts = useAppFonts as jest.Mock;

describe('splash while fonts load', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps the splash and renders nothing until the fonts are ready', async () => {
    mockFonts.mockReturnValue(false);
    const screen = await render(<RootLayout />);
    expect(screen.queryByTestId('stack')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('hides the splash and shows the app once the fonts are ready', async () => {
    mockFonts.mockReturnValue(true);
    const screen = await render(<RootLayout />);
    expect(screen.getByTestId('stack')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });
});
