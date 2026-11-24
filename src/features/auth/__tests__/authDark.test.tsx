import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { lightOnly, paintedColors } from '@/testing/darkColors';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/api/client', () => ({ api: jest.fn() }));

describe.each([
  ['login', LoginScreen],
  ['register', RegisterScreen],
  ['forgot password', ForgotPasswordScreen],
])('%s screen in dark mode', (_name, Screen) => {
  it('paints no leftover of the light mode', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    await render(
      <QueryClientProvider client={new QueryClient()}>
        <Screen />
      </QueryClientProvider>,
    );
    expect(
      paintedColors(screen.toJSON() as never).filter((color) =>
        lightOnly.includes(color),
      ),
    ).toEqual([]);
  });
});
